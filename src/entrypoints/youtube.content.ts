import "@/content/widget.css";
import { handleTranscriptMessage, clearCachedTranscript, getTranscript } from "@/content/widget";
import { getCustomPrompt } from "@/common/storage";

function flashButton(btn: HTMLButtonElement, text: string, cls: string) {
  const original = btn.textContent;
  btn.textContent = text;
  btn.classList.add(cls);
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove(cls);
  }, 1500);
}

// YouTube's SPA leaves stale, hidden/empty #top-level-buttons-computed nodes in
// the DOM; pick the first one that is actually rendered (visible + non-empty),
// matching the original widget's injection-target selection. querySelector's
// plain first-match (what WXT's string anchor used) can land on a hidden one.
function visibleActionBar(): HTMLElement | undefined {
  for (const bar of document.querySelectorAll<HTMLElement>("#top-level-buttons-computed")) {
    if (bar.children.length === 0) continue;
    const rect = bar.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    return bar;
  }
  return undefined;
}

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data?.type === "SYB_TRANSCRIPT") {
        handleTranscriptMessage(event.data.data);
      }
    });

    const ui = await createShadowRootUi(ctx, {
      name: "syb-widget",
      position: "inline",
      inheritStyles: true,
      anchor: visibleActionBar,
      append: "last",
      onMount(container) {
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
            const customPrompt = await getCustomPrompt();
            const prompt = customPrompt + text;
            chrome.runtime.sendMessage({ type: "openChatGPT", prompt });
            flashButton(summarizeBtn, "Sent!", "success");
          } catch {
            flashButton(summarizeBtn, "No transcript available", "error");
          }
        });

        container.appendChild(copyBtn);
        container.appendChild(summarizeBtn);
      },
    });

    // Resilient injection — replaces ui.autoMount(). YouTube frequently rebuilds
    // the action bar's children on SPA navigation WITHOUT removing the container
    // element, which autoMount's element-presence observer never sees, so the
    // widget silently fails to re-appear. Re-assert placement on a short interval
    // (mirrors the original setInterval(tryInjectWidget, 500)): build once into
    // the first visible action bar, then re-home the host whenever YouTube wipes
    // or swaps that bar.
    let built = false;
    const ensureInjected = () => {
      const bar = visibleActionBar();
      if (!bar) return;
      if (!built) {
        ui.mount();
        built = true;
      } else if (ui.shadowHost.parentElement !== bar) {
        bar.appendChild(ui.shadowHost);
      }
    };
    ensureInjected();
    const injectTimer = setInterval(ensureInjected, 500);
    ctx.onInvalidated(() => clearInterval(injectTimer));

    let lastUrl = location.href;
    document.addEventListener("yt-navigate-finish", () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        clearCachedTranscript();
      }
    });
  },
});
