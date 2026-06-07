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
      anchor: "#top-level-buttons-computed",
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
    ui.autoMount();

    let lastUrl = location.href;
    document.addEventListener("yt-navigate-finish", () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        clearCachedTranscript();
      }
    });
  },
});
