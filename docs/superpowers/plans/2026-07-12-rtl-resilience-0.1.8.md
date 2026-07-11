# RTL Resilience (v0.1.8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore RTL for Cursor AI chat responses (broken by a Cursor update that moved AI content out of `.composer-rendered-message`), fix the per-code-block toggle, deepen the Questions-panel RTL, and add a diagnose command — all backward-compatible.

**Architecture:** The extension injects a CSS + JS file into Cursor's `workbench.html`. All changes are concentrated in the injected *content* (`src/content.ts`) plus a new diagnose module. The injection/patching layer (`finder.ts`, `injector.ts`, activation flow) is proven working and is NOT touched. CSS is additive: old selectors stay as fallback for un-updated Cursor; new `ui-markdown__*` classes + `[data-message-role]` data-attributes are added alongside (double-guarding). Behavior stays auto-by-text-type (`unicode-bidi: plaintext` + `text-align: start`).

**Tech Stack:** TypeScript (ESM), esbuild bundling, VS Code extension API, Node 20 built-in `node:test` + `tsx` for unit tests.

**Spec:** [docs/superpowers/specs/2026-07-12-rtl-resilience-design.md](../specs/2026-07-12-rtl-resilience-design.md)

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/content.ts` | The injected CSS (`RTL_CSS`) + JS (`RTL_JS`) strings, built from small per-area functions | **Modify** — add AI-markdown RTL fn, update LTR anchors, deepen questionnaire, fix opt-in + JS `closest()` |
| `src/diagnose.ts` | Pure anchor-audit logic + known-anchor list | **Create** |
| `src/extension.ts` | Command registration + activation | **Modify** — register `cursor-rtl.diagnose` |
| `package.json` | Manifest: commands, version | **Modify** — declare command, bump to 0.1.8 |
| `changelog.md` | Release notes | **Modify** — 0.1.8 entry |
| `src/content.test.ts` | Unit tests asserting generated CSS/JS content | **Create** |
| `src/diagnose.test.ts` | Unit tests for `auditAnchors` | **Create** |
| `tsconfig.json` | exclude test files from the shipped build | **Modify** |

---

## Task 1: Minimal test runner

**Files:**
- Modify: `package.json` (devDependency + test script)
- Modify: `tsconfig.json` (exclude `*.test.ts` from build)
- Create: `src/smoke.test.ts` (temporary — proves the runner works; deleted in Step 5)

- [ ] **Step 1: Add `tsx` devDependency and a `test` script**

In `package.json`, add to `devDependencies` (keep alphabetical-ish with existing):
```json
"tsx": "^4.19.0"
```
Add to `scripts`:
```json
"test": "node --import tsx --test src/*.test.ts"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: `tsx` added to `node_modules`, no errors.

- [ ] **Step 3: Write a smoke test to prove the runner executes**

Create `src/smoke.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('runner works', () => {
    assert.equal(1 + 1, 2);
});
```

- [ ] **Step 4: Run it**

Run: `npm test`
Expected: PASS — `tests 1 / pass 1`.

- [ ] **Step 5: Exclude test files from the shipped build, then remove the smoke test**

In `tsconfig.json`, ensure an `exclude` entry covers tests. Read the file first; add `"src/**/*.test.ts"` to the `exclude` array (create the array if absent).

Delete `src/smoke.test.ts`.

- [ ] **Step 6: Verify the production build still works**

Run: `npm run build`
Expected: esbuild completes, `dist/extension.js` produced, no type errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: add minimal node:test + tsx test runner"
```

---

## Task 2: Diagnose module (pure logic, TDD)

**Files:**
- Create: `src/diagnose.ts`
- Create: `src/diagnose.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/diagnose.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditAnchors, KNOWN_ANCHORS } from './diagnose.js';

test('auditAnchors counts occurrences and flags presence', () => {
    const bundle = 'a .markdown-root b .markdown-root c .ui-code-block d';
    const report = auditAnchors(bundle, ['.markdown-root', '.ui-code-block', '.gone-selector']);
    assert.deepEqual(report, [
        { anchor: '.markdown-root', hits: 2, present: true },
        { anchor: '.ui-code-block', hits: 1, present: true },
        { anchor: '.gone-selector', hits: 0, present: false },
    ]);
});

test('KNOWN_ANCHORS includes the critical current anchors', () => {
    for (const a of ['.markdown-root', '.ui-code-block', 'data-message-role', '.composer-questionnaire-toolbar']) {
        assert.ok(KNOWN_ANCHORS.includes(a), `missing ${a}`);
    }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./diagnose.js`.

- [ ] **Step 3: Write the implementation**

Create `src/diagnose.ts`:
```ts
export interface AnchorReport {
    anchor: string;
    hits: number;
    present: boolean;
}

/**
 * Count literal occurrences of each anchor string in the bundle text.
 * Pure + synchronous so it is unit-testable without touching the filesystem.
 */
export function auditAnchors(bundle: string, anchors: string[]): AnchorReport[] {
    return anchors.map(anchor => {
        const hits = bundle.split(anchor).length - 1;
        return { anchor, hits, present: hits > 0 };
    });
}

/**
 * Anchors the injected CSS/JS relies on. When a future Cursor update breaks
 * RTL, run the diagnose command: a MISSING entry points at the stale selector.
 * Split into "current" (must be present on modern Cursor) and "legacy"
 * (kept as fallback; expected to be 0 on modern Cursor — informational only).
 */
export const KNOWN_ANCHORS: string[] = [
    // current — modern Cursor
    'data-message-role',
    'data-message-kind',
    '.markdown-root',
    '.ui-markdown__paragraph',
    '.ui-markdown__list',
    '.ui-markdown__heading',
    '.ui-markdown__table',
    '.ui-code-block',
    '.ui-default-code__line-content',
    '.ui-code-block-copy-overlay',
    '.composer-questionnaire-toolbar',
    '.composer-human-message',
    'composer.createNewComposerTab',
    // legacy — fallback (0 hits on modern Cursor is fine)
    '.composer-rendered-message',
    '.composer-message-codeblock',
    '.chat-markdown-part',
    '.interactive-result-code-block',
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add src/diagnose.ts src/diagnose.test.ts
git commit -m "feat: add auditAnchors diagnose logic"
```

---

## Task 3: Wire the diagnose command

**Files:**
- Modify: `src/extension.ts` (register command)
- Modify: `package.json` (`contributes.commands`)

- [ ] **Step 1: Read the current command-registration pattern**

Read `src/extension.ts` and locate where existing commands (`cursor-rtl.add`, `cursor-rtl.remove`, `cursor-rtl.status`) are registered with `vscode.commands.registerCommand` and pushed to `context.subscriptions`. Match that exact pattern.

- [ ] **Step 2: Declare the command in the manifest**

In `package.json` → `contributes.commands`, add:
```json
{
  "command": "cursor-rtl.diagnose",
  "title": "Cursor Chat RTL: Diagnose Selectors"
}
```

- [ ] **Step 3: Register the command handler**

At the top of `src/extension.ts`, add imports (match the existing `.js` ESM import style used in the file):
```ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { auditAnchors, KNOWN_ANCHORS } from './diagnose.js';
```
(If `fs/promises` / `path` are already imported, do not duplicate.)

Add this handler function near the other command handlers:
```ts
async function runDiagnose(): Promise<void> {
    const channel = vscode.window.createOutputChannel('Cursor Chat RTL');
    channel.show(true);
    const bundlePath = path.join(
        vscode.env.appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js',
    );
    channel.appendLine('Cursor Chat RTL — selector diagnosis');
    channel.appendLine(`Bundle: ${bundlePath}`);
    channel.appendLine('');
    let bundle: string;
    try {
        bundle = await fs.readFile(bundlePath, 'utf-8');
    } catch (e) {
        channel.appendLine(`ERROR: cannot read bundle — ${(e as Error).message}`);
        return;
    }
    for (const r of auditAnchors(bundle, KNOWN_ANCHORS)) {
        const mark = r.present ? '✓' : '✗';
        const note = r.present ? `${r.hits} hits` : 'MISSING — selector may be stale';
        channel.appendLine(`${mark} ${r.anchor.padEnd(34)} ${note}`);
    }
}
```

Register it alongside the other commands (match existing style):
```ts
context.subscriptions.push(
    vscode.commands.registerCommand('cursor-rtl.diagnose', runDiagnose),
);
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: no type errors; `dist/extension.js` produced.

- [ ] **Step 5: Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: add cursor-rtl.diagnose command"
```

---

## Task 4: New AI-markdown RTL rules (requirements A + B)

**Files:**
- Modify: `src/content.ts` (add `rtlAiMarkdown` fn, wire into `RTL_CSS`)
- Create/append: `src/content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/content.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RTL_CSS } from './content.js';

test('AI markdown RTL is anchored on both new and legacy selectors', () => {
    // new stable anchors
    assert.match(RTL_CSS, /\[data-message-role="ai"\]/);
    assert.match(RTL_CSS, /\.markdown-root/);
    // legacy fallback kept for un-updated Cursor
    assert.match(RTL_CSS, /\.composer-rendered-message/);
    assert.match(RTL_CSS, /\.chat-markdown-part/);
});

test('AI text uses auto-by-content (plaintext + start), not forced right', () => {
    assert.match(RTL_CSS, /unicode-bidi:\s*plaintext/);
    assert.match(RTL_CSS, /text-align:\s*start/);
});

test('lists and tables are covered (requirement B)', () => {
    assert.match(RTL_CSS, /\bul\b/);
    assert.match(RTL_CSS, /ui-markdown__td|\btd\b/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `unicode-bidi: plaintext` / `[data-message-role="ai"]` not yet present (current CSS uses the old composer selectors + embed).

- [ ] **Step 3: Add the `rtlAiMarkdown` function**

In `src/content.ts`, add a new function next to `rtlComposerMarkdown`:
```ts
/**
 * Modern Cursor AI response markdown. AI content moved OUT of
 * `.composer-rendered-message` into `[data-message-role="ai"]` → `.markdown-root`.
 * Behavior is auto-by-content: each block picks direction from its text
 * (plaintext) and aligns accordingly (start). Double-guarded: tag names +
 * `ui-markdown__*` classes.
 * @param p - selector prefix including trailing space (e.g. "body.cursor-chat-rtl ")
 */
function rtlAiMarkdown(p: string): string {
    return `
/* --- TEXT: RTL (modern Cursor AI markdown) --- */

${p}:is([data-message-role="ai"], .markdown-root) {
    direction: rtl;
}

${p}:is([data-message-role="ai"], .markdown-root) :is(
    p, li, h1, h2, h3, h4, h5, h6, blockquote, ul, ol,
    .ui-markdown__paragraph, .ui-markdown__list, .ui-markdown__list-item,
    .ui-markdown__heading, .ui-markdown__blockquote
) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}

${p}:is([data-message-role="ai"], .markdown-root) :is(
    th, td, .ui-markdown__th, .ui-markdown__td
) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}
`;
}
```

- [ ] **Step 4: Wire it into `RTL_CSS`**

In `src/content.ts`, find the `RTL_CSS` template literal. Add the new call immediately after the existing `rtlComposerMarkdown(...)` line, keeping the legacy calls in place:
```ts
${rtlLegacyMarkdown(`body.${BODY_CLASS} `)}
${rtlComposerMarkdown(`body.${BODY_CLASS} `)}
${rtlAiMarkdown(`body.${BODY_CLASS} `)}
${rtlQuestionnaire(`body.${BODY_CLASS} `)}
```
(Do not remove `rtlLegacyMarkdown` or `rtlComposerMarkdown` — they are the backward-compat fallback.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all three new tests green.

- [ ] **Step 6: Commit**

```bash
git add src/content.ts src/content.test.ts
git commit -m "feat: RTL for modern Cursor AI markdown (data-message-role/markdown-root anchors)"
```

---

## Task 5: Fix code-LTR anchors (`.ui-code-block`)

**Files:**
- Modify: `src/content.ts` (`ltrOverrides` fn)
- Modify: `src/content.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/content.test.ts`:
```ts
test('code stays LTR via current .ui-code-block anchors', () => {
    assert.match(RTL_CSS, /\.ui-code-block\b/);
    assert.match(RTL_CSS, /\.ui-default-code__line-content/);
    // still isolate so Hebrew strings inside code do not flip the line
    assert.match(RTL_CSS, /unicode-bidi:\s*isolate/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `.ui-default-code__line-content` not yet in `ltrOverrides`.

- [ ] **Step 3: Extend `ltrOverrides`**

In `src/content.ts`, inside the `ltrOverrides(p)` function, add a new rule block (keep all existing legacy LTR rules for backward-compat):
```ts
${p}:is(
    .ui-code-block,
    .ui-default-code,
    .ui-default-code__line-content,
    .ui-markdown__inline-code
) {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}
```
(The existing `pre, code` and `.composer-*` rules remain unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content.ts src/content.test.ts
git commit -m "fix: LTR code anchors for modern Cursor (.ui-code-block)"
```

---

## Task 6: Fix per-code-block toggle (requirement C)

**Files:**
- Modify: `src/content.ts` (`RTL_JS` click handler + `OPT_IN_RTL_OVERRIDES`)
- Modify: `src/content.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/content.test.ts`:
```ts
import { RTL_JS } from './content.js';

test('per-code-block toggle anchors on .ui-code-block with legacy fallback', () => {
    assert.match(RTL_JS, /closest\(['"]\.ui-code-block['"]\)/);
    assert.match(RTL_JS, /closest\(['"]\.composer-message-codeblock['"]\)/);
});

test('opt-in RTL override targets .ui-code-block and comes after global code-LTR', () => {
    assert.match(RTL_CSS, /\.ui-code-block\.cursor-code-rtl/);
    const globalLtr = RTL_CSS.indexOf('.ui-default-code__line-content');
    const optIn = RTL_CSS.indexOf('.ui-code-block.cursor-code-rtl');
    assert.ok(globalLtr !== -1 && optIn !== -1 && optIn > globalLtr,
        'opt-in must appear after the global code-LTR rule to win on equal specificity');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — handler still uses only `.composer-message-codeblock`; opt-in still anchored on `.composer-message-codeblock`.

- [ ] **Step 3: Fix the JS click handler**

In `src/content.ts` → `RTL_JS`, find:
```js
var codeblock = clicked.closest('.composer-message-codeblock');
if (!codeblock) return;
```
Replace with:
```js
var codeblock = clicked.closest('.ui-code-block') || clicked.closest('.composer-message-codeblock');
if (!codeblock) return;
```

- [ ] **Step 4: Fix the opt-in CSS**

In `src/content.ts` → `OPT_IN_RTL_OVERRIDES`, replace the selector block that currently starts with `.composer-message-codeblock.cursor-code-rtl .ui-code-block` so it anchors on the modern container first (keep the legacy one as fallback):
```ts
const OPT_IN_RTL_OVERRIDES = `
/* --- Per-code-block RTL (opt-in via cursor-code-rtl class) --- */

.ui-code-block.cursor-code-rtl :is(.ui-default-code, .ui-default-code__line-content),
.composer-message-codeblock.cursor-code-rtl .ui-code-block {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: plaintext !important;
}

/* --- Code-block toggle active state --- */

.cursor-code-rtl-btn.cursor-rtl-active {
    background: var(--vscode-button-background, rgba(128, 128, 128, 0.3)) !important;
    opacity: 1 !important;
}
`;
```
Confirm `OPT_IN_RTL_OVERRIDES` is still concatenated LAST in the `RTL_CSS` template (after `ltrOverrides(...)`), so the opt-in wins on equal specificity.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/content.ts src/content.test.ts
git commit -m "fix: per-code-block RTL toggle works on modern Cursor (.ui-code-block)"
```

---

## Task 7: Deepen Questions-panel RTL (requirement D)

> **DATA DEPENDENCY:** This task needs a live DOM dump of a real Questions panel to finalize inner selectors. The top anchor `.composer-questionnaire-toolbar` is confirmed (32 hits); inner selectors (question title, A/B/C/D options, Skip/Continue buttons) are not yet captured. **Step 1 obtains that DOM.**

**Files:**
- Modify: `src/content.ts` (`rtlQuestionnaire` fn)
- Modify: `src/content.test.ts`

- [ ] **Step 1: Capture the Questions-panel DOM**

Ask the user to trigger a Questions panel in Cursor and copy its `outerHTML` (DevTools → Elements → the `.composer-questionnaire-toolbar` node → Copy → Copy outerHTML). Identify the class/tag of: (a) the question text, (b) each option row, (c) the Skip / Continue buttons. Record them in this task before writing selectors. **Do not guess — wait for the DOM.**

- [ ] **Step 2: Write the failing test** (using the anchors found in Step 1; the example below assumes the confirmed top anchor plus generic inner tags — replace inner anchors with the captured ones)

Append to `src/content.test.ts`:
```ts
test('questionnaire card is RTL and its text is auto-by-content', () => {
    assert.match(RTL_CSS, /\.composer-questionnaire-toolbar\s*\{[^}]*direction:\s*rtl/);
    // inner text auto-directioned (anchors filled in from captured DOM)
    assert.match(RTL_CSS, /\.composer-questionnaire-toolbar[^{]*plaintext/);
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test`
Expected: FAIL — current `rtlQuestionnaire` only sets `direction: rtl` on the toolbar, no inner text rule.

- [ ] **Step 4: Extend `rtlQuestionnaire`**

In `src/content.ts`, replace the body of `rtlQuestionnaire(p)` with (fill `/* CAPTURED */` with the real inner anchors from Step 1):
```ts
function rtlQuestionnaire(p: string): string {
    return `
/* --- TEXT: RTL (Questions panel) --- */

${p}.composer-questionnaire-toolbar {
    direction: rtl !important;
}

${p}.composer-questionnaire-toolbar :is(p, span, label, li /* CAPTURED inner anchors */) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}
`;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Manually verify in Cursor**

Reload Cursor with the built extension, toggle RTL on, open a Hebrew Questions panel. Confirm: card mirrors RTL, question + options right-aligned, Skip/Continue in correct positions, English-only questions stay LTR.

- [ ] **Step 7: Commit**

```bash
git add src/content.ts src/content.test.ts
git commit -m "feat: deepen Questions-panel RTL (requirement D)"
```

---

## Task 8: Version bump, changelog, package

**Files:**
- Modify: `package.json` (version)
- Modify: `changelog.md`

- [ ] **Step 1: Bump the version**

In `package.json`, change `"version": "0.1.7"` → `"version": "0.1.8"`.

- [ ] **Step 2: Add the changelog entry**

Prepend to `changelog.md` (after the top `# Changelog` header block, before `## [0.1.7]`):
```markdown
## [0.1.8] - 2026-07-12

### Fixed
- **RTL restored for AI responses.** A Cursor update moved AI chat content out of `.composer-rendered-message`, so RTL alignment stopped applying. The extension now anchors on the current `[data-message-role="ai"]` / `.markdown-root` structure (with the old selectors kept as a fallback for un-updated Cursor).
- **Per-code-block ⇄ toggle works again.** The toggle now finds the code block via `.ui-code-block` (its container was renamed from `.composer-message-codeblock`).
- **Code stays LTR reliably.** LTR guards re-anchored on `.ui-code-block` / `.ui-default-code__line-content`, replacing the removed `.composer-code-block-container` / `.composer-diff-block` / `.composer-terminal-output`.

### Added
- **Questions panel RTL** — the full card (question, options, actions) now follows RTL, with text auto-directioned by content.
- **`Cursor Chat RTL: Diagnose Selectors` command** — reports which DOM anchors still exist in the installed Cursor, so future breakage can be pinpointed in seconds.

### Notes
- AI text direction is automatic per block: Hebrew-leading blocks align right, English-only blocks stay LTR. Code blocks stay LTR until you click their per-block ⇄ toggle.
```

- [ ] **Step 3: Build and package**

Run: `npm run build`
Expected: clean build.

Run: `npm run package`
Expected: `cursor-chat-rtl-0.1.8.vsix` produced.

- [ ] **Step 4: Commit**

```bash
git add package.json changelog.md cursor-chat-rtl-0.1.8.vsix
git commit -m "chore: release v0.1.8"
```

---

## Task 9: Full manual verification in Cursor

**Files:** none (verification only)

- [ ] **Step 1: Install the built vsix into Cursor and activate**

Install `cursor-chat-rtl-0.1.8.vsix`, run `Cursor Chat RTL: Activate`, restart Cursor.

- [ ] **Step 2: Run the checklist**

Toggle RTL on, then confirm in a chat containing mixed content:
1. Hebrew paragraph → aligned right.
2. Paragraph that is entirely English → stays LTR (auto-by-content).
3. `ul`/`ol` list + sub-headings → aligned per content.
4. A table → RTL.
5. A code block → stays LTR; Hebrew string inside it does not flip the line.
6. Click a code block's ⇄ → that block flips to RTL; others unaffected.
7. Hebrew Questions panel → card RTL, options + buttons aligned.
8. Toggle off → everything returns to LTR.
9. Run `Cursor Chat RTL: Diagnose Selectors` → all "current" anchors show ✓.

- [ ] **Step 3: Record the result**

Note any failing item. If all pass, the branch is ready to finish (use superpowers:finishing-a-development-branch).

---

## Self-Review Notes

- **Spec coverage:** A → Task 4; B → Task 4; C → Task 6; D → Task 7; backward-compat (old+new) → Tasks 4/5/6 keep legacy selectors; code-LTR → Task 5; diagnose → Tasks 2/3; version/changelog → Task 8; manual verify → Task 9. No spec requirement left unmapped.
- **Data dependency:** Task 7 explicitly blocks on capturing the live Questions-panel DOM before writing inner selectors (Step 1), consistent with the spec's open dependency.
- **Type consistency:** `auditAnchors`/`KNOWN_ANCHORS`/`AnchorReport` names match across `diagnose.ts`, `diagnose.test.ts`, and `extension.ts`. `rtlAiMarkdown(p)` matches the existing `rtl*(p)` prefix-function signature.
