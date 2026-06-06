# Permissions Justification — StopYappingBro

This document contains the per-permission rationale for the Chrome Web Store submission.
Paste the relevant section into the corresponding field in the Developer Dashboard.

---

## `activeTab`

StopYappingBro acts on the YouTube tab the user is actively viewing when they click the
extension's "Copy Transcript" or "Summarize" button. `activeTab` grants that interaction
scoped to a user gesture, avoiding any need for broad, always-on tab access. Without it, the
extension cannot read the transcript of the video the user is currently watching.

---

## `storage`

StopYappingBro stores a single user setting — a custom summarization prompt — in
`chrome.storage.local`. This is required so the user's chosen prompt persists across browser
sessions. Without this permission, the prompt would reset to the default every time the
browser is closed. No user data is transmitted off-device; storage is sandboxed per-extension
by Chrome.

---

## Host permission — `https://www.youtube.com/*`

The extension's core function is to read a YouTube video's transcript. It injects a content
script (and a small page-context script) into YouTube watch pages to observe YouTube's own
transcript API responses and to render the "Copy Transcript" / "Summarize" buttons in the
video action bar. This host permission is scoped to YouTube only — the single site where the
extension reads transcripts. The extension is read-only on YouTube: it observes transcript
data and never modifies, redirects, or blocks any request.

---

## Host permission — `https://chatgpt.com/*`

When the user clicks "Summarize", the extension opens a new tab to `chatgpt.com` and fills the
message composer with the user's prompt followed by the transcript, then submits it — driving
the ChatGPT web app in the user's own logged-in session, exactly as if the user pasted and
sent the message themselves. This host permission is scoped to ChatGPT only and is required to
fill and submit the composer. The transcript is sent only to ChatGPT; the extension transmits
no data anywhere else and makes no network requests of its own.
