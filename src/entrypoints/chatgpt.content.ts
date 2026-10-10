import { fillInput, submit, waitForInput } from "@/content/composer";

export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  main() {
    async function fillPrompt() {
      const { prompt } = await chrome.runtime.sendMessage({ type: "getPrompt" });
      if (!prompt) return;

      const input = await waitForInput();
      if (!input) {
        console.warn("[StopYappingBro] ChatGPT composer not found");
        return;
      }

      fillInput(input, prompt);
      await submit(input);
    }

    fillPrompt();
  },
});
