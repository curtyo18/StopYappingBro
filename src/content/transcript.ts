export function extractTranscript(data: unknown): string {
  const segments: string[] = [];
  walk(data, segments, false);
  return segments.join(" ");
}

function walk(node: unknown, out: string[], insideNoResult: boolean): void {
  if (node === null || node === undefined) return;
  if (typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) walk(item, out, insideNoResult);
    return;
  }

  const obj = node as Record<string, unknown>;

  // Format 1: get_panel — transcriptSegmentViewModel.simpleText
  if ("transcriptSegmentViewModel" in obj) {
    const vm = obj.transcriptSegmentViewModel as Record<string, unknown>;
    if (typeof vm.simpleText === "string") {
      out.push(vm.simpleText);
    }
  }

  // Format 2: get_transcript — transcriptSegmentRenderer.snippet.runs[].text
  if ("transcriptSegmentRenderer" in obj) {
    const renderer = obj.transcriptSegmentRenderer as Record<string, unknown>;
    const snippet = renderer.snippet as Record<string, unknown> | undefined;
    if (snippet && Array.isArray(snippet.runs)) {
      for (const run of snippet.runs) {
        if (run && typeof run === "object" && typeof (run as Record<string, unknown>).text === "string") {
          out.push((run as Record<string, unknown>).text as string);
        }
      }
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === "noResultLabel" || key === "retryLabel") continue;
    walk(value, out, insideNoResult);
  }
}
