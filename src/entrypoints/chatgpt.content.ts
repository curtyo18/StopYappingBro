export default defineContentScript({
  matches: ["https://chatgpt.com/*"],
  runAt: "document_idle",
  main() {
    async function fillPrompt() {
      const { prompt } = await chrome.runtime.sendMessage({ type: "getPrompt" });
      if (!prompt) return;

      const textarea = await waitForElement<HTMLElement>("#prompt-textarea[contenteditable]");
      if (!textarea) return;

      textarea.focus();
      textarea.innerHTML = "";
      const p = document.createElement("p");
      p.textContent = prompt;
      textarea.appendChild(p);
      textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));

      // Wait for the submit button to become enabled
      await new Promise((r) => setTimeout(r, 300));

      const submitBtn = document.querySelector<HTMLButtonElement>("#composer-submit-button");
      if (submitBtn) submitBtn.click();
    }

    function waitForElement<T extends Element>(
      selector: string,
      timeout = 10000,
    ): Promise<T | null> {
      return new Promise((resolve) => {
        const el = document.querySelector<T>(selector);
        if (el) return resolve(el);

        const timer = setTimeout(() => {
          obs.disconnect();
          resolve(null);
        }, timeout);

        const obs = new MutationObserver(() => {
          const found = document.querySelector<T>(selector);
          if (found) {
            clearTimeout(timer);
            obs.disconnect();
            resolve(found);
          }
        });

        obs.observe(document.body, { childList: true, subtree: true });
      });
    }

    fillPrompt();
  },
});
