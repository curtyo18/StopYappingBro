let pendingPrompt: string | null = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "openChatGPT") {
    pendingPrompt = message.prompt;
    chrome.tabs.create({ url: "https://chatgpt.com" });
  }

  if (message.type === "getPrompt") {
    const prompt = pendingPrompt;
    pendingPrompt = null;
    sendResponse({ prompt });
  }

  return true;
});
