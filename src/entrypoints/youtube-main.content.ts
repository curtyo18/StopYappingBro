export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  world: "MAIN",
  runAt: "document_start",
  main() {
    const originalFetch = window.fetch;
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const response = await originalFetch.call(window, input, init);
      if (
        url.includes("prettyPrint=false") &&
        (url.includes("get_panel") || url.includes("get_transcript"))
      ) {
        try {
          const data = await response.clone().json();
          window.postMessage({ type: "SYB_TRANSCRIPT", data }, "*");
        } catch {
          // ignore parse errors
        }
      }
      return response;
    };
  },
});
