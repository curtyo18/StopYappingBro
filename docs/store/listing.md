# StopYappingBro — Chrome Web Store Listing Pack

Copy-paste source for the CWS Developer Dashboard. Draft — review before publishing.

---

## Store item name (max 75 chars)

**Package display name (manifest):** `StopYappingBro`

**Recommended store listing name:** `StopYappingBro — YouTube Transcript Summarizer` (46 chars)
*(Softens the casual one-word name with a descriptive subtitle so a browsing
user knows what it does. Keeps "YouTube" descriptive, not implying endorsement.
Your call — package name can stay "StopYappingBro".)*

## Summary / short description (max 132 chars)

`Copy YouTube transcripts and summarize them with ChatGPT — get the gist without sitting through the yapping.` (107 chars)

*(The manifest's current 51-char summary "Copy YouTube transcripts and summarize
with ChatGPT" also works and is safely under the limit.)*

## Category

**Productivity**

## Language

**English (United Kingdom)** (or en-US — match your dashboard default)

## Single-purpose description (required, Privacy tab — separate field)

> StopYappingBro extracts the transcript of the YouTube video you are watching and
> either copies it to your clipboard or sends it to ChatGPT (in your own logged-in
> session) for a concise summary. That single transcript-to-summary flow is its
> only purpose.

## Detailed description (max 16,000 chars)

> **Get the gist of any YouTube video without sitting through the yapping.**
>
> StopYappingBro adds two buttons to the YouTube video action bar (next to Like
> and Share):
>
> • **Copy Transcript** — pulls the video's transcript and copies clean,
>   plain-text to your clipboard, ready for notes or search.
> • **Summarize** — pulls the transcript, opens a new ChatGPT tab, prefills the
>   composer with your prompt followed by the transcript, and submits it — so you
>   get a concise summary in seconds.
>
> Perfect for long lectures, talks, podcasts, and reviews when you just want the
> key points.
>
> **It uses the AI you already have.** StopYappingBro does not host its own AI
> model and has no API keys. The Summarize button drives the ChatGPT web app in
> your own logged-in browser session — exactly as if you pasted the transcript
> and hit send yourself.
>
> **Privacy-first by design.**
> • Makes no network requests of its own.
> • Sends no data to the developer or any analytics service — there is no
>   telemetry.
> • The transcript only ever goes to the ChatGPT tab you open.
> • The only thing it stores is your custom summarization prompt, kept locally on
>   your device.
> • Runs no remote code — all logic ships inside the extension.
>
> **Customizable.** Edit the summarization prompt in the popup; your version is
> saved locally and reused every time.
>
> Open source — code and privacy policy linked below.

## Screenshots (≥1 required; 1280×800 or 640×400)

- **Present:** `docs/screenshot.png` (640×400, 24-bit, no alpha) — the Copy
  Transcript / Summarize buttons in the YouTube action bar. Submittable as-is.
- **Recommended extras** (scrub anything personal first):
  the popup with the editable summarization prompt; the resulting ChatGPT tab with
  the transcript prefilled + summary.

Note: all screenshots in one listing should share the same dimensions, so any
extras should also be 640×400 to match.

Store icon 128×128 is already present (`public/icons/icon128.png`).

## Privacy policy URL

`https://curtyo18.github.io/StopYappingBro/privacy.html`
*(GitHub Pages — enabled 2026-06-08, build status "built". Confirm it renders in
a browser before submitting.)*

---

## Privacy practices tab

### Single purpose
See single-purpose description above.

### Permission justifications

**`storage`**
> Stores a single user setting — a custom summarization prompt — in
> chrome.storage.local so it persists across browser sessions. Without it the
> prompt would reset to the default every time the browser closes. No user data is
> transmitted off-device; storage is sandboxed per-extension by Chrome.

**Host permission — `https://www.youtube.com/*`**
> The extension's core function is to read a YouTube video's transcript. It injects
> a content script (and a small page-context script) into YouTube watch pages to
> observe YouTube's own transcript API responses and to render the Copy
> Transcript / Summarize buttons in the action bar. Scoped to YouTube only — the
> single site where the extension reads transcripts. Read-only: it observes
> transcript data and never modifies, redirects, or blocks any request.

**Host permission — `https://chatgpt.com/*`**
> When the user clicks Summarize, the extension opens a new chatgpt.com tab and
> fills the message composer with the user's prompt followed by the transcript,
> then submits it — driving the ChatGPT web app in the user's own logged-in
> session, exactly as if the user pasted and sent the message themselves. Scoped
> to ChatGPT only; required to fill and submit the composer. The transcript is
> sent only to ChatGPT; the extension makes no network requests of its own.

### Data usage disclosures

- **Remote code:** No — all code is bundled in the package. *(The MAIN-world
  script's `window.fetch` patch is bundled, not fetched.)*
- **Does this item collect or use user data?** **Does not collect** any of the
  listed data categories. Rationale: the transcript is handled transiently and
  sent only to the user's own ChatGPT tab on explicit user action; the only stored
  value is a user-entered prompt, kept locally. Nothing is sent to the developer
  or a third party.
- **Certification checkboxes:** affirm all three (not sold/transferred for
  unrelated purposes; not used for creditworthiness/lending).

### Reviewer notes (paste into the "notes to reviewer" field)

> Capture mechanism, stated up front: a MAIN-world content script
> (`youtube-main.content.ts`) patches `window.fetch` to passively observe
> YouTube's own transcript API responses (`get_panel` / `get_transcript`) and
> relays them to the isolated-world widget via `window.postMessage`. It never
> modifies, blocks, or redirects requests, and fetches nothing remotely — there is
> no remotely hosted code. The only web-accessible resource is the widget's CSS.
> Permissions are minimal (storage only, host access limited to youtube.com
> and chatgpt.com). No `<all_urls>`, no debugger, no webRequest.

---

## Submission checklist (SYB)

- [x] MV3 package built at current version (1.2.5) — `.output/stop-yapping-bro-1.2.5-chrome.zip` (also on the v1.2.5 GitHub release)
- [x] Privacy policy hosted — Pages enabled (confirm renders in browser)
- [x] 128×128 icon present
- [x] ≥1 screenshot (`docs/screenshot.png`, 640×400) — optional extras recommended
- [ ] CWS developer account + $5 fee + 2-Step Verification + verified contact email (user)
- [ ] Category / language / visibility set in dashboard
- [ ] Paste summary, detailed description, single-purpose, permission
      justifications, reviewer notes
- [ ] Data-use disclosures answered (above)
- [ ] Upload zip + screenshots + icon → Submit
- [ ] Do NOT upload the legacy root zips (`stop-yapping-bro-v*.zip`)
