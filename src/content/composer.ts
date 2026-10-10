// ChatGPT composer helpers. ChatGPT reshuffles its DOM often, so the input is
// found by scoring every visible editable on the page rather than trusting one
// selector: known composer selectors earn the most, generic signals (inside a
// form, textbox role, "Ask…" label, wide, low on screen) carry it when those
// selectors rot. When ChatGPT's UI changes, add a selector to KNOWN_INPUT_SELECTORS.

/** Selectors that have identified the composer in some ChatGPT UI version. */
export const KNOWN_INPUT_SELECTORS = [
  "#prompt-textarea",
  "[data-composer-input] [contenteditable='true']",
  "form[data-chatgpt-composer] [contenteditable='true']",
  "textarea[name='prompt-textarea']",
];

const CANDIDATES =
  "[contenteditable='true'], [contenteditable=''], [contenteditable='plaintext-only'], textarea";
// Editors that are never the composer: modals, menus, side panels (canvas),
// and inline edit boxes on earlier messages.
const EXCLUDED_ANCESTORS =
  "[role='dialog'], [role='menu'], [role='listbox'], [aria-hidden='true'], [inert], nav, aside, header, [data-message-author-role], [data-testid^='conversation-turn'], [data-testid*='canvas' i], [id*='canvas' i]";
const COMPOSER_LABEL = /ask|message|chat|prompt|anything|send/i;
const MIN_SCORE = 4;

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const check = (el as Element & { checkVisibility?: (o?: object) => boolean }).checkVisibility;
  return check ? check.call(el, { visibilityProperty: true, opacityProperty: true }) : true;
}

function isEditable(el: HTMLElement): boolean {
  if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly;
  return el.isContentEditable && el.getAttribute("aria-readonly") !== "true";
}

function labelOf(el: HTMLElement): string {
  return [
    el.getAttribute("aria-label"),
    el.getAttribute("aria-placeholder"),
    el.getAttribute("placeholder"),
    el.querySelector("[data-placeholder]")?.getAttribute("data-placeholder"),
  ]
    .filter(Boolean)
    .join(" ");
}

/** Score how likely `el` is the chat composer; null if it can't be. */
export function scoreInput(el: HTMLElement): number | null {
  if (!el.isConnected || !isEditable(el) || !isVisible(el)) return null;
  if (el.closest(EXCLUDED_ANCESTORS)) return null;
  // Nested contenteditables: only the outermost editing host is a real input.
  if (el.parentElement?.closest("[contenteditable='true']")) return null;

  let score = 0;
  if (KNOWN_INPUT_SELECTORS.some((sel) => el.matches(sel))) score += 10;
  if (el.closest("form")) score += 3;
  if (el.closest("main")) score += 1;
  if (el.getAttribute("role") === "textbox" || el instanceof HTMLTextAreaElement) score += 2;
  if (COMPOSER_LABEL.test(labelOf(el))) score += 3;
  if (el.classList.contains("ProseMirror")) score += 1;

  const rect = el.getBoundingClientRect();
  if (rect.width >= window.innerWidth * 0.3) score += 2;
  if (rect.top >= window.innerHeight * 0.25) score += 1;
  return score;
}

/** The most composer-like editable on the page, or null if nothing qualifies. */
export function findInput(root: ParentNode = document): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestScore = MIN_SCORE - 1;
  for (const el of root.querySelectorAll<HTMLElement>(CANDIDATES)) {
    const score = scoreInput(el);
    if (score !== null && score > bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Wait for the composer and for the page to stop swapping it out: ChatGPT
 * hydrates late and often re-mounts the composer, detaching the first match.
 */
export async function waitForInput(timeout = 30000, settleMs = 400): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout;
  let candidate: HTMLElement | null = null;
  while (Date.now() < deadline) {
    candidate = await waitFor(findInput, deadline - Date.now());
    if (!candidate) return null;
    await new Promise((r) => setTimeout(r, settleMs));
    const current = findInput();
    if (current === candidate) return current;
  }
  return candidate?.isConnected ? candidate : findInput();
}

export const SUBMIT_SELECTORS = [
  "#composer-submit-button",
  "[data-testid='send-button']",
  "form button[type='submit']",
  "form button[aria-label*='send' i]",
];

export function findFirst<T extends Element>(
  selectors: string[],
  root: ParentNode = document,
): T | null {
  for (const sel of selectors) {
    const el = root.querySelector<T>(sel);
    if (el) return el;
  }
  return null;
}

export function waitFor<T>(find: () => T | null, timeout = 10000): Promise<T | null> {
  return new Promise((resolve) => {
    const initial = find();
    if (initial) return resolve(initial);

    const done = (v: T | null) => {
      clearTimeout(timer);
      clearInterval(poll);
      obs.disconnect();
      resolve(v);
    };
    const check = () => {
      const found = find();
      if (found) done(found);
    };

    const timer = setTimeout(() => done(null), timeout);
    // Polling catches attribute-only changes (e.g. disabled → enabled) the
    // childList observer misses.
    const poll = setInterval(check, 100);
    const obs = new MutationObserver(check);
    obs.observe(document.body, { childList: true, subtree: true });
  });
}

/** Insert text the way a user would, so ProseMirror updates its own state. */
export function fillInput(input: HTMLElement, text: string): void {
  if (input instanceof HTMLTextAreaElement) return fillTextarea(input, text);

  input.focus();
  const selection = window.getSelection();
  selection?.selectAllChildren(input);

  const inserted = document.execCommand?.("insertText", false, text);
  if (inserted && input.textContent?.includes(text.slice(0, 50))) return;

  // Fallback: write the DOM directly and announce it.
  input.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = text;
  input.appendChild(p);
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

/** React ignores `el.value = x`; go through the native setter so it sees the change. */
function fillTextarea(input: HTMLTextAreaElement, text: string): void {
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(input, text);
  else input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function isEnabled(btn: HTMLButtonElement): boolean {
  return !btn.disabled && btn.getAttribute("aria-disabled") !== "true";
}

/** Click the send button once it's enabled; fall back to pressing Enter. */
export async function submit(input: HTMLElement, timeout = 5000): Promise<void> {
  const form = input.closest("form");
  const btn = await waitFor(() => {
    const b = findFirst<HTMLButtonElement>(SUBMIT_SELECTORS, form ?? document);
    return b && isEnabled(b) ? b : null;
  }, timeout);

  if (btn) {
    btn.click();
    return;
  }

  input.focus();
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      bubbles: true,
      cancelable: true,
    }),
  );
}
