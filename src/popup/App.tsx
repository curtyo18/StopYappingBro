import { useEffect, useState } from "preact/hooks";
import { getCustomPrompt, setCustomPrompt, resetCustomPrompt, DEFAULT_PROMPT } from "../common/storage";

export function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  useEffect(() => {
    getCustomPrompt().then(setPrompt);
  }, []);

  const handlePromptChange = (e: Event) => {
    const newPrompt = (e.target as HTMLTextAreaElement).value;
    setPrompt(newPrompt);
    setCustomPrompt(newPrompt);
  };

  const handleReset = () => {
    resetCustomPrompt();
    setPrompt(DEFAULT_PROMPT);
  };

  return (
    <div class="popup">
      <h1>StopYappingBro</h1>
      <p>
        Look for the <strong>Copy Transcript</strong> and <strong>Summarize</strong> buttons in the YouTube action bar (next to Like/Share).
      </p>

      <div class="prompt-editor">
        <label htmlFor="prompt-input">Summarize Prompt:</label>
        <textarea
          id="prompt-input"
          value={prompt}
          onInput={handlePromptChange}
          rows={4}
        />
        <button onClick={handleReset}>Reset to Default</button>
      </div>
    </div>
  );
}
