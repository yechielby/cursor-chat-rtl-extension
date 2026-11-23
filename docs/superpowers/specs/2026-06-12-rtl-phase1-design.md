# RTL Coverage Expansion — Phase 1

**Version target:** v0.1.7
**Date:** 2026-06-12
**Status:** Approved — ready for implementation plan

## Goal

Extend the `cursor-chat-rtl` extension to cover two additional UI areas in Cursor that the current RTL injection does not reach:

1. The **Questions panel** (the structured question prompt with A/B/C/D options that Cursor's agent uses to ask the user a multiple-choice question).
2. The **Markdown editor** — add a per-file RTL toggle button to any `.md` file opened in Cursor's editor.

3. A per-code-block **RTL toggle button** placed next to the existing Copy button inside each chat code block, allowing the user to flip a single code block to RTL on demand (default stays LTR).

This is Phase 1 of a multi-phase plan. Items deferred to later phases (and not addressed here):
- User-answer / Q&A summary card after answering a Question.
- Plan card embedded in chat (title + todos).
- Thought block (collapsible "Thought briefly").

## Design principle: Always-RTL, not auto

All CSS rules added in this phase use plain `direction: rtl !important;`. We do not use `unicode-bidi: plaintext` (auto-detection per paragraph based on first strong character). The user's preference is consistency over per-paragraph auto-detection — every targeted element is forced RTL regardless of content language. This is consistent with how `.interactive-input-editor .view-lines` is already handled in the existing code.

## Change 1 — Questions panel RTL

### Selector (verified against Cursor app bundle)

The Questions panel root element is `.composer-questionnaire-toolbar`. It is the toolbar inserted above the input box when Cursor asks a multiple-choice question. Its children form a flex layout: header (`composer-questionnaire-toolbar-header`), questions list (`composer-questionnaire-toolbar-questions`), and actions (`composer-questionnaire-toolbar-actions` with Skip / Continue).

### CSS

A single rule scoped to the body class:

```css
body.cursor-chat-rtl .composer-questionnaire-toolbar {
    direction: rtl !important;
}
```

This flips the flex direction of all descendant flex containers and aligns text to the right. The A/B/C/D letter buttons and "1 of N" stepper labels remain readable because they live inside their own `inline-block` / `flex` children that respect their own intrinsic content direction.

### Where it lives in source

New helper in [src/content.ts](../../../src/content.ts):

```ts
function rtlQuestionnaire(p: string): string {
    return `
/* --- Questions panel --- */
${p}.composer-questionnaire-toolbar {
    direction: rtl !important;
}
`;
}
```

Called from the `RTL_CSS` template alongside the existing `rtlLegacyMarkdown`, `rtlComposerMarkdown`, `ltrOverrides` calls.

### Known unknowns

If the stepper chevrons (`composer-questionnaire-toolbar-stepper-icon` — up/down arrows next to "1 of N") visually point the wrong way after the flip, we add a focused LTR override for `.composer-questionnaire-toolbar-stepper`. Not done preemptively; only if testing shows it's needed.

## Change 2 — Markdown editor RTL toggle (new feature)

A new, independent feature: a per-file RTL toggle button that appears in the editor title-bar action area whenever a `.md` file is open. Clicking it flips the editor's text direction to RTL for that file only, with state persisted per-file URI.

### Independence from chat RTL toggle

This feature works **independently** of the existing chat `⇄` toggle. The MD button can be used even when the chat-RTL mode is off. The CSS for the per-file RTL class is **not** gated by `body.cursor-chat-rtl`:

```css
.monaco-editor.cursor-md-rtl[data-mode-id="markdown"] .view-lines {
    direction: rtl !important;
    text-align: right !important;
}
```

The button is injected unconditionally whenever a Monaco markdown editor is detected — regardless of whether `body.cursor-chat-rtl` is active.

### Selector for the editor

Cursor's Monaco instance carries `data-mode-id="markdown"` on `.monaco-editor` for markdown documents, plus `data-uri="file:///..."` identifying the file. These are the anchors for both detection and per-file state.

### Selector for the toolbar (button injection site)

Same toolbar pattern as the existing chat `⇄` injection, scoped to the editor instance:

```
.editor-actions .monaco-action-bar > ul.actions-container[aria-label="Editor actions"]
```

This `ul` is the action list at the top-right of each editor. The new button is appended as a new `li` at the end (after existing actions).

### JS behavior

Added to `RTL_JS` in [src/content.ts](../../../src/content.ts) inside the existing IIFE (or as a sibling block). Conceptually:

1. **Detection loop:** A MutationObserver on `document.body` scans for newly-added `.monaco-editor[data-mode-id="markdown"]` elements. (The existing observer in `RTL_JS` can be reused or paired with a sibling — implementation detail for the plan stage.)

2. **Button injection (per editor):**
   - Locate the editor's local `.editor-actions ul.actions-container[aria-label="Editor actions"]`.
   - If a button with id `cursor-md-rtl-btn-<n>` (unique per editor) does not already exist, append a new `li.action-item` with an `a` carrying the `⇄` glyph.
   - The button reuses the same look-and-feel as the existing chat toggle (`cursor-rtl-active` class for the "on" state).

3. **Click handler:**
   - Read URI from the `.monaco-editor[data-uri]` attribute.
   - Toggle `cursor-md-rtl` class on the `.monaco-editor`.
   - Toggle the button's `cursor-rtl-active` class to reflect state.
   - Persist: `localStorage.setItem('cursor-md-rtl:' + uri, isActive ? 'true' : 'false')`.

4. **State restoration:**
   - On every editor detection: read `cursor-md-rtl:<uri>` from `localStorage`. If `'true'`, add `cursor-md-rtl` class to the editor and `cursor-rtl-active` to its button.

### Monaco caveat

Monaco renders text with absolutely-positioned line elements and a virtual cursor overlay. Applying `direction: rtl` to `.view-lines` flips visual text layout, but cursor positioning, selection rectangles, and find/replace highlights are rendered by Monaco's own layout engine that assumes LTR. Visual artifacts (off-by-one cursor position, selection drawn on wrong side) are possible.

**Mitigation strategy:** Ship Phase 1 with `direction: rtl` as proposed. If manual testing surfaces a blocking visual artifact, fall back to `unicode-bidi: plaintext` only (less aggressive — adds bidi handling without inverting the layout). This fallback decision is deferred to the implementation/testing step.

### Where it lives in source

- CSS string addition to `RTL_CSS` in [src/content.ts](../../../src/content.ts).
- JS extension to `RTL_JS` in the same file.

No new source files. No changes to [src/extension.ts](../../../src/extension.ts), [src/injector.ts](../../../src/injector.ts), [src/finder.ts](../../../src/finder.ts), [src/statusBar.ts](../../../src/statusBar.ts), [src/types.ts](../../../src/types.ts), [src/utils.ts](../../../src/utils.ts).

## Change 3 — Per-code-block RTL toggle (new feature)

A small `⇄` button injected next to the existing Copy button inside every chat code block. Default for code blocks remains LTR (as enforced by the existing `ltrOverrides`). The button is an opt-in, per-block override.

### Independence from chat RTL toggle

Same approach as Change 2: the button is injected unconditionally and the per-block CSS is not gated by `body.cursor-chat-rtl`. The user can flip an individual code block to RTL regardless of the chat-RTL mode.

### Selectors (verified against Cursor app bundle)

- **Code block container:** `.composer-message-codeblock` (outer wrapper used in `composer-rendered-message`). The visible code surface inside it is `.ui-code-block`.
- **Existing Copy-button overlay:** `.ui-code-block-copy-overlay` — the `div` that sits over the code and contains the Copy button (`button.ui-icon-button.ui-code-block-copy`).
- **New button:** appended as a sibling `button.ui-icon-button.cursor-code-rtl-btn` inside `.ui-code-block-copy-overlay`, immediately before or after the Copy button. Same `ui-icon-button` class for consistent visual style.

### JS behavior

Added to `RTL_JS` in [src/content.ts](../../../src/content.ts):

1. **Detection:** MutationObserver scans for new `.ui-code-block-copy-overlay` elements (or new `.composer-message-codeblock`).
2. **Injection (per block):** If overlay does not already contain a `.cursor-code-rtl-btn`, append a new `<button>` with the same `ui-icon-button` shell and an `⇄` glyph (icon-font or text). Title: "Toggle RTL for this code block".
3. **Click handler:** Toggle class `cursor-code-rtl` on the closest `.composer-message-codeblock`. Toggle a visual "active" state on the button (e.g., `cursor-rtl-active` for consistency with the chat toggle).
4. **State:** Ephemeral — no persistence. Code blocks lack stable identifiers across reloads. State resets when Cursor reopens. (Keeping it simple; revisit if persistence is needed in a later phase.)

### CSS

Added to `RTL_CSS` in [src/content.ts](../../../src/content.ts), placed **after** the existing `ltrOverrides()` output so cascade order is correct:

```css
.composer-message-codeblock.cursor-code-rtl .ui-code-block,
.composer-message-codeblock.cursor-code-rtl .ui-code-block .ui-default-code__line-content {
    direction: rtl !important;
    text-align: right !important;
}
```

The override is independent of `body.cursor-chat-rtl`. The specificity of `body.cursor-chat-rtl .composer-message-codeblock` (the existing LTR forcing rule) is (0, 2, 1); the new selector `.composer-message-codeblock.cursor-code-rtl .ui-code-block` is (0, 3, 1) — wins regardless of body class state.

### Where it lives in source

- CSS string addition to `RTL_CSS` in [src/content.ts](../../../src/content.ts).
- JS extension to `RTL_JS` in the same file.

No new source files.

## Versioning & release

- Bump `version` in [package.json](../../../package.json) to `0.1.7`.
- Add an entry to [changelog.md](../../../changelog.md) describing both changes.
- Commit message: `v0.1.7: RTL for Questions panel + MD editor toggle + per-code-block RTL toggle`.
- Since the injected CSS/JS content changes, the auto-reinjection logic in [src/extension.ts](../../../src/extension.ts) will pick up the new version on next activation (it compares the injected version against the current extension version).

## Manual test plan

No automated tests exist in this project. Verification is by hand inside a running Cursor instance after installing the new `.vsix`.

1. **Questions panel:**
   - Trigger a Cursor agent flow that asks a multiple-choice question (any chat task that ends with a Question prompt).
   - With chat RTL active: the entire Questions card is right-aligned; Hebrew text in question prompt and option labels reads correctly; A/B/C/D letters remain readable.
   - With chat RTL inactive: the Questions card is unchanged (LTR).

2. **MD editor toggle button:**
   - Open any `.md` file in Cursor.
   - A `⇄` button appears in the editor's top-right action toolbar.
   - Click it: the visible text in `.view-lines` flips to RTL and aligns right. Line-number gutter and minimap remain LTR.
   - Close the file and reopen it: RTL state is restored from `localStorage`.
   - Open a second `.md` file in a split editor: its RTL state is independent.

3. **Per-code-block toggle:**
   - Open any chat message that contains a code block.
   - A small `⇄` button appears inside the code block's hover overlay, next to the existing Copy button.
   - Click it: that single code block flips to RTL. Other code blocks remain LTR. The chat-RTL mode (whole-chat toggle) does not need to be active for this to work.
   - Reload Cursor or open a new chat: the per-block state resets (ephemeral by design).

4. **No regressions:**
   - The existing chat `⇄` button still works.
   - Code blocks, JSON, terminal output inside chat remain LTR **by default** (only flipped when the new per-block button is clicked).
   - Opening a non-`.md` file does not show the MD toggle button.

## Out of scope (future phases)

- Q&A summary card after answering a Question.
- Plan card (`composer-plan-container`, `composer-plan-title`, `composer-plan-todos`).
- Thought block (`ui-thinking-collapsible`).
