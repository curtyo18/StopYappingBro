export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "openChatGPT") {
      chrome.storage.session
        .set({ pendingPrompt: message.prompt })
        .then(() => chrome.tabs.create({ url: "https://chatgpt.com" }));
      return false;
    }
    if (message.type === "getPrompt") {
      chrome.storage.session.get("pendingPrompt").then(({ pendingPrompt }) => {
        void chrome.storage.session.remove("pendingPrompt");
        sendResponse({ prompt: pendingPrompt ?? null });
      });
      return true; // keep the channel open for the async sendResponse
    }
    return false;
  });
});
