import { tryInjectWidget, handleTranscriptMessage, clearCachedTranscript } from "./widget";

function injectInterceptor() {
  if (document.querySelector("#syb-intercept")) return;
  const script = document.createElement("script");
  script.id = "syb-intercept";
  script.src = chrome.runtime.getURL("src/content/intercept.js");
  document.documentElement.appendChild(script);
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "SYB_TRANSCRIPT") {
    handleTranscriptMessage(event.data.data);
  }
});

injectInterceptor();
setInterval(tryInjectWidget, 500);

// Clear cached transcript on SPA navigation so we don't use stale data
let lastUrl = location.href;
document.addEventListener("yt-navigate-finish", () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    clearCachedTranscript();
  }
});
