export const DEFAULT_PROMPT = "Summarize this YouTube transcript extremely concisely:\n\n";

export async function getCustomPrompt(): Promise<string> {
  try {
    const result = await chrome.storage.local.get("customPrompt");
    return result.customPrompt || DEFAULT_PROMPT;
  } catch {
    return DEFAULT_PROMPT;
  }
}

export async function setCustomPrompt(prompt: string): Promise<void> {
  try {
    await chrome.storage.local.set({ customPrompt: prompt });
  } catch (error) {
    console.error("Failed to save prompt:", error);
  }
}

export async function resetCustomPrompt(): Promise<void> {
  try {
    await chrome.storage.local.remove("customPrompt");
  } catch (error) {
    console.error("Failed to reset prompt:", error);
  }
}
