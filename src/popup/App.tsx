import { useEffect, useState } from "preact/hooks";
import {
  getCustomPrompt,
  setCustomPrompt,
  resetCustomPrompt,
  DEFAULT_PROMPT,
} from "../common/storage";

export function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCustomPrompt()
      .then(setPrompt)
      .catch(() => {
        setError("Failed to load prompt");
      });
  }, []);

  const handlePromptChange = (e: InputEvent) => {
    const newPrompt = (e.target as HTMLTextAreaElement).value;
    setPrompt(newPrompt);
    setError(null); // Clear error on user action
    setCustomPrompt(newPrompt).catch(() => {
      setError("Failed to save prompt");
    });
  };

  const handleReset = () => {
    setError(null);
    resetCustomPrompt().catch(() => {
      setError("Failed to reset prompt");
    });
    setPrompt(DEFAULT_PROMPT);
  };

  return (
    <div class="popup">
      <h1>StopYappingBro</h1>
      <p>
        Look for the <strong>Copy Transcript</strong> and <strong>Summarize</strong> buttons in the
        YouTube action bar (next to Like/Share).
      </p>

      {error && <div class="error-message">{error}</div>}

      <div class="prompt-editor">
        <label htmlFor="prompt-input">Summarize Prompt:</label>
        <textarea id="prompt-input" value={prompt} onInput={handlePromptChange} rows={4} />
        <button onClick={handleReset}>Reset to Default</button>
      </div>
    </div>
  );
}
