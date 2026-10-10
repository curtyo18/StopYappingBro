import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fillInput, findInput, submit, waitForInput } from "@/content/composer";

// chatgpt.com 2026-10 composer, trimmed of icons/styling (no #prompt-textarea,
// no send button until text is typed).
const REAL_UI = readFileSync(
  path.resolve(__dirname, "../fixtures/chatgpt-composer-2026-10.html"),
  "utf8",
);

const CURRENT_UI = `
  <form data-chatgpt-composer="">
    <div data-composer-input="">
      <div contenteditable="true" role="textbox" class="ProseMirror" aria-label="Ask ChatGPT">
        <p data-placeholder="Ask ChatGPT" class="placeholder"><br></p>
      </div>
    </div>
    <button type="button" aria-label="Start Voice"></button>
  </form>`;

const LEGACY_UI = `
  <form>
    <div id="prompt-textarea" contenteditable="true"><p></p></div>
    <button id="composer-submit-button"></button>
  </form>`;

// happy-dom has no layout: give every element a wide, low-on-screen box unless
// it (or an ancestor) is marked data-hidden or carries data-rect="w,h,top".
beforeEach(() => {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    if (this.closest("[data-hidden]")) return new DOMRect(0, 0, 0, 0);
    const [w, h, top] = (this.closest("[data-rect]")?.getAttribute("data-rect") ?? "600,40,500")
      .split(",")
      .map(Number);
    return new DOMRect(0, top, w, h);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("findInput", () => {
  it("finds the composer in real ChatGPT markup", () => {
    document.body.innerHTML = REAL_UI;
    expect(findInput()?.getAttribute("aria-label")).toBe("Ask ChatGPT");
  });

  it("finds the legacy #prompt-textarea", () => {
    document.body.innerHTML = LEGACY_UI;
    expect(findInput()?.id).toBe("prompt-textarea");
  });

  it("finds a plain textarea composer", () => {
    document.body.innerHTML = `<main><form><textarea placeholder="Message ChatGPT"></textarea></form></main>`;
    expect(findInput()?.tagName).toBe("TEXTAREA");
  });

  it("survives every ChatGPT-specific attribute being renamed", () => {
    document.body.innerHTML = `
      <main><form><div>
        <div contenteditable="true" role="textbox" aria-label="Ask anything"></div>
      </div></form></main>`;
    expect(findInput()?.getAttribute("aria-label")).toBe("Ask anything");
  });

  it("skips a hidden stale composer that precedes the live one", () => {
    document.body.innerHTML = `<div data-hidden>${CURRENT_UI}</div><div id="live">${CURRENT_UI}</div>`;
    expect(findInput()?.closest("#live")).not.toBeNull();
  });

  it("prefers the composer over a canvas editor earlier in the DOM", () => {
    document.body.innerHTML = `
      <section data-testid="canvas-panel"><div contenteditable="true" class="ProseMirror"></div></section>
      ${CURRENT_UI}`;
    expect(findInput()?.getAttribute("aria-label")).toBe("Ask ChatGPT");
  });

  it("ignores the edit box on an earlier message", () => {
    document.body.innerHTML = `
      <main>
        <article data-testid="conversation-turn-1"><form><textarea></textarea></form></article>
        ${CURRENT_UI}
      </main>`;
    expect(findInput()?.tagName).toBe("DIV");
  });

  it("ignores editables in dialogs, nav, and read-only boxes", () => {
    document.body.innerHTML = `
      <div role="dialog"><form><textarea placeholder="Message"></textarea></form></div>
      <nav><div contenteditable="true" role="textbox" aria-label="Rename chat"></div></nav>
      <form><textarea readonly placeholder="Message"></textarea></form>`;
    expect(findInput()).toBeNull();
  });

  it("returns null for a lone stray editable with no composer signals", () => {
    document.body.innerHTML = `<div data-rect="80,20,10"><div contenteditable="true"></div></div>`;
    expect(findInput()).toBeNull();
  });
});

describe("waitForInput", () => {
  it("waits for a composer that renders late", async () => {
    setTimeout(() => (document.body.innerHTML = CURRENT_UI), 50);
    expect((await waitForInput(2000, 50))?.getAttribute("aria-label")).toBe("Ask ChatGPT");
  });

  it("returns the remounted composer, not the detached first one", async () => {
    document.body.innerHTML = CURRENT_UI;
    const first = findInput();
    setTimeout(() => (document.body.innerHTML = CURRENT_UI), 20);
    const found = await waitForInput(2000, 100);
    expect(found).not.toBe(first);
    expect(found?.isConnected).toBe(true);
  });

  it("gives up with null when nothing qualifies", async () => {
    expect(await waitForInput(150, 20)).toBeNull();
  });
});

describe("fillInput", () => {
  it("fills a textarea and fires input", () => {
    document.body.innerHTML = `<form><textarea></textarea></form>`;
    const ta = document.querySelector("textarea")!;
    const onInput = vi.fn();
    ta.addEventListener("input", onInput);
    fillInput(ta, "summarize this");
    expect(ta.value).toBe("summarize this");
    expect(onInput).toHaveBeenCalledOnce();
  });

  it("puts the prompt text in the editor", () => {
    document.body.innerHTML = CURRENT_UI;
    const input = findInput()!;
    fillInput(input, "summarize this");
    expect(input.textContent).toContain("summarize this");
  });
});

describe("submit", () => {
  it("clicks the send button once it appears", async () => {
    document.body.innerHTML = CURRENT_UI;
    const input = findInput()!;
    const click = vi.fn();
    setTimeout(() => {
      const btn = document.createElement("button");
      btn.setAttribute("data-testid", "send-button");
      btn.addEventListener("click", click);
      input.closest("form")!.appendChild(btn);
    }, 50);
    await submit(input, 1000);
    expect(click).toHaveBeenCalledOnce();
  });

  it("ignores the voice button and falls back to Enter", async () => {
    document.body.innerHTML = CURRENT_UI;
    const input = findInput()!;
    const keys: string[] = [];
    input.addEventListener("keydown", (e) => keys.push(e.key));
    await submit(input, 150);
    expect(keys).toEqual(["Enter"]);
  });
});
