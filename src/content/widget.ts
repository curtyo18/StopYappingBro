import css from "./widget.css?inline";
import { extractTranscript } from "./transcript";

let cachedTranscript: string | null = null;
let transcriptResolve: ((text: string) => void) | null = null;

export function handleTranscriptMessage(data: unknown) {
  const text = extractTranscript(data);
  if (!text) return;

  cachedTranscript = text;

  if (transcriptResolve) {
    transcriptResolve(text);
    transcriptResolve = null;
  }
}

export function clearCachedTranscript() {
  cachedTranscript = null;
}

function waitForTranscript(timeout = 8000): Promise<string> {
  if (cachedTranscript) return Promise.resolve(cachedTranscript);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      transcriptResolve = null;
      reject(new Error("timeout"));
    }, timeout);

    transcriptResolve = (text: string) => {
      clearTimeout(timer);
      resolve(text);
    };
  });
}

function clickShowTranscript(): boolean {
  const btn = document.querySelector<HTMLElement>(
    "ytd-video-description-transcript-section-renderer button"
  );
  if (btn) {
    btn.click();
    return true;
  }

  const spans = document.querySelectorAll<HTMLElement>(
    "button yt-formatted-string, button span.yt-core-attributed-string"
  );
  for (const span of spans) {
    if (span.textContent?.trim().toLowerCase() === "show transcript") {
      const button = span.closest("button");
      if (button) {
        button.click();
        return true;
      }
    }
  }
  return false;
}

async function getTranscript(): Promise<string> {
  // If we already have a cached transcript from an intercepted fetch, use it
  if (cachedTranscript) return cachedTranscript;

  // Otherwise, try clicking "Show transcript" to trigger the fetch
  const promise = waitForTranscript();
  if (!clickShowTranscript()) {
    throw new Error("no-button");
  }
  return promise;
}

function flashButton(btn: HTMLButtonElement, text: string, cls: string) {
  const original = btn.textContent;
  btn.textContent = text;
  btn.classList.add(cls);
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove(cls);
  }, 1500);
}

function createWidget(): HTMLElement {
  const host = document.createElement("div");
  host.id = "syb-widget";
  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy Transcript";

  const summarizeBtn = document.createElement("button");
  summarizeBtn.textContent = "Summarize";

  copyBtn.addEventListener("click", async () => {
    try {
      const text = await getTranscript();
      await navigator.clipboard.writeText(text);
      flashButton(copyBtn, "Copied!", "success");
    } catch {
      flashButton(copyBtn, "No transcript available", "error");
    }
  });

  summarizeBtn.addEventListener("click", async () => {
    try {
      const text = await getTranscript();
      const prompt = "Summarize this YouTube transcript extremely concisely:\n\n" + text;
      chrome.runtime.sendMessage({ type: "openChatGPT", prompt });
      flashButton(summarizeBtn, "Sent!", "success");
    } catch {
      flashButton(summarizeBtn, "No transcript available", "error");
    }
  });

  shadow.appendChild(copyBtn);
  shadow.appendChild(summarizeBtn);

  return host;
}

const WIDGET_ID = "syb-widget";

export function tryInjectWidget() {
  if (document.getElementById(WIDGET_ID)?.isConnected) return;
  const target = document.querySelector("#top-level-buttons-computed");
  if (!target) return;
  target.appendChild(createWidget());
}
