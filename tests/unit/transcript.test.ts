import { describe, it, expect } from "vitest";
import { extractTranscript } from "@/content/transcript";

describe("extractTranscript", () => {
  it("returns empty string for nullish / non-object input", () => {
    expect(extractTranscript(null)).toBe("");
    expect(extractTranscript(undefined)).toBe("");
    expect(extractTranscript("a string")).toBe("");
    expect(extractTranscript(42)).toBe("");
  });

  it("extracts get_panel format (transcriptSegmentViewModel.simpleText)", () => {
    const data = {
      segments: [
        { transcriptSegmentViewModel: { simpleText: "Hello" } },
        { transcriptSegmentViewModel: { simpleText: "world" } },
      ],
    };
    expect(extractTranscript(data)).toBe("Hello world");
  });

  it("extracts get_transcript format (transcriptSegmentRenderer.snippet.runs[].text)", () => {
    const data = {
      items: [
        {
          transcriptSegmentRenderer: {
            snippet: { runs: [{ text: "foo " }, { text: "bar" }] },
          },
        },
        {
          transcriptSegmentRenderer: {
            snippet: { runs: [{ text: "baz" }] },
          },
        },
      ],
    };
    expect(extractTranscript(data)).toBe("foo  bar baz");
  });

  it("walks deeply nested structures", () => {
    const data = {
      a: { b: { c: [{ transcriptSegmentViewModel: { simpleText: "deep" } }] } },
    };
    expect(extractTranscript(data)).toBe("deep");
  });

  it("skips noResultLabel and retryLabel branches", () => {
    const data = {
      noResultLabel: { transcriptSegmentViewModel: { simpleText: "ignored" } },
      retryLabel: { transcriptSegmentViewModel: { simpleText: "ignored" } },
      body: { transcriptSegmentViewModel: { simpleText: "kept" } },
    };
    expect(extractTranscript(data)).toBe("kept");
  });

  it("ignores non-string simpleText and malformed runs", () => {
    const data = {
      a: { transcriptSegmentViewModel: { simpleText: 123 } },
      b: { transcriptSegmentRenderer: { snippet: { runs: [{ text: 7 }, null, {}] } } },
      c: { transcriptSegmentViewModel: { simpleText: "only this" } },
    };
    expect(extractTranscript(data)).toBe("only this");
  });

  it("returns empty string when no transcript nodes are present", () => {
    expect(extractTranscript({ foo: "bar", nested: { x: [1, 2, 3] } })).toBe("");
  });
});
