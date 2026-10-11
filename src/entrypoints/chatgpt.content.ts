import { sendPrompt } from "@/content/composer";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  main() {
    async function fillPrompt() {
      const { prompt } = await chrome.runtime.sendMessage({ type: "getPrompt" });
      if (!prompt) return;

      if (!(await sendPrompt(prompt))) {
        console.warn("[StopYappingBro] Couldn't fill the ChatGPT composer");
      }
    }

    fillPrompt();
  },
});
