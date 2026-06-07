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
    "ytd-video-description-transcript-section-renderer button",
  );
  if (btn) {
    btn.click();
    return true;
  }

  const spans = document.querySelectorAll<HTMLElement>(
    "button yt-formatted-string, button span.yt-core-attributed-string",
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

export async function getTranscript(): Promise<string> {
  // If we already have a cached transcript from an intercepted fetch, use it
  if (cachedTranscript) return cachedTranscript;

  // Otherwise, try clicking "Show transcript" to trigger the fetch
  const promise = waitForTranscript();
  if (!clickShowTranscript()) {
    throw new Error("no-button");
  }
  return promise;
}
