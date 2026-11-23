/**
 * CSS/JS injected into the **Cursor IDE** workbench (via extension injector), not a separate Cursor product.
 */
/** Injected workbench asset names */
export const HTML_LINK_MARKER = 'cursor-chat-rtl.css';
export const CSS_FILENAME = 'cursor-chat-rtl.css';
export const JS_FILENAME = 'cursor-chat-rtl.js';

/** Mode marker inside CSS (for status / upgrades) */
export const RTL_MODE_ACTIVE_MARKER = '/* RTL-MODE: active */';

const BODY_CLASS = 'cursor-chat-rtl';
const BTN_ID = 'cursor-rtl-toggle-btn';
const MIXED_CLASS = 'cursor-rtl-mixed';

/** Toggle button + active state */
const BUTTON_CSS = `
/* ==========================================
   Toggle ⇄ — next to New Chat (+)
   ========================================== */

#${BTN_ID} {
    font-size: 14px !important;
    font-weight: bold !important;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    color: var(--vscode-foreground);
    opacity: 0.5;
    transition: opacity 0.2s, background 0.2s;
    flex-shrink: 0;
    display: flex !important;
    align-items: center;
    justify-content: center;
    text-decoration: none !important;
}

#${BTN_ID}:hover {
    opacity: 1;
}

#${BTN_ID}.cursor-rtl-active {
    opacity: 1;
    background: var(--vscode-button-background, rgba(128, 128, 128, 0.3));
}
`;

/**
 * Legacy / VS Code–style chat panes (`.chat-markdown-part`, interactive input).
 * @param p - selector prefix including trailing space (e.g. "body.cursor-chat-rtl ")
 */
function rtlLegacyMarkdown(p: string): string {
    return `
/* --- TEXT: RTL (legacy chat) --- */

${p}.chat-markdown-part.rendered-markdown {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
}

${p}.chat-markdown-part.rendered-markdown p,
${p}.chat-markdown-part.rendered-markdown ul,
${p}.chat-markdown-part.rendered-markdown ol,
${p}.chat-markdown-part.rendered-markdown li,
${p}.chat-markdown-part.rendered-markdown h1,
${p}.chat-markdown-part.rendered-markdown h2,
${p}.chat-markdown-part.rendered-markdown h3,
${p}.chat-markdown-part.rendered-markdown h4,
${p}.chat-markdown-part.rendered-markdown blockquote {
    text-align: right !important;
    unicode-bidi: embed !important;
}

${p}.chat-markdown-part.rendered-markdown a {
    unicode-bidi: plaintext !important;
}

${p}.interactive-input-editor .view-lines {
    direction: rtl !important;
    text-align: right !important;
}
`;
}

/**
 * Cursor Composer / Agent pane (`.composer-rendered-message`, `.markdown-root`, human bubble editors).
 * @param p - selector prefix including trailing space
 */
function rtlComposerMarkdown(p: string): string {
    return `
/* --- TEXT: RTL (Cursor Composer) --- */

${p}.composer-rendered-message .markdown-root {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
}

${p}.composer-rendered-message .markdown-root :is(p, ul, ol, li, h1, h2, h3, h4, blockquote) {
    text-align: right !important;
    unicode-bidi: embed !important;
}

${p}.composer-rendered-message .markdown-root a {
    unicode-bidi: plaintext !important;
}

${p}.composer-human-message-container .composer-human-message,
${p}.composer-human-message .aislash-editor-input-readonly {
    direction: rtl !important;
    unicode-bidi: plaintext !important;
}

${p}.composer-human-message-container .aislash-editor-input-readonly {
    text-align: right !important;
}
`;
}

/**
 * Modern Cursor AI response markdown. AI content moved OUT of
 * `.composer-rendered-message` into `[data-message-role="ai"]` → `.markdown-root`,
 * which is why RTL stopped applying to AI responses after a Cursor update.
 *
 * Behavior is auto-by-content: each block picks direction from its own text
 * (`unicode-bidi: plaintext`, like `dir="auto"`) and aligns accordingly
 * (`text-align: start`). So a Hebrew block aligns right, a purely-English block
 * stays LTR. Double-guarded: real tag names (never rename) + `ui-markdown__*`
 * design-system classes.
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

/**
 * Cursor Questions panel (`.composer-questionnaire-toolbar`).
 * @param p - selector prefix including trailing space
 */
function rtlQuestionnaire(p: string): string {
    return `
/* --- TEXT: RTL (Questions panel) --- */

/* Whole card mirrors RTL: header, options, actions/stepper all flow right. */
${p}.composer-questionnaire-toolbar {
    direction: rtl !important;
}

/* Text-bearing parts align by content (Hebrew→right, English→left). */
${p}:is(
    .composer-questionnaire-toolbar-title,
    .composer-questionnaire-toolbar-question,
    .composer-questionnaire-toolbar-question-label,
    .composer-questionnaire-toolbar-option,
    .composer-questionnaire-toolbar-option-label,
    .composer-questionnaire-toolbar-freeform-input,
    .composer-questionnaire-toolbar-stepper-label,
    .questionnaire-answer-text,
    .questionnaire-answer-value
) {
    text-align: start !important;
    unicode-bidi: plaintext !important;
}

/* A/B/C/D letter badges stay upright/LTR (single Latin glyphs). */
${p}.composer-questionnaire-toolbar-option-letter {
    direction: ltr !important;
    unicode-bidi: isolate !important;
}
`;
}

/**
 * Mixed-text paragraphs. `unicode-bidi: plaintext` picks direction from the FIRST letter,
 * so "Cursor הוא עורך קוד" renders LTR. The injected JS adds `cursor-rtl-mixed` to such
 * paragraphs (Latin first letter, but containing an RTL letter); this forces them RTL.
 * Gated by the body class like every other RTL rule, so ⇄ still turns it off.
 * The class is repeated to out-rank the `plaintext` rules above (max (0,3,1)) regardless of
 * which container the paragraph sits in. Inline code keeps its own LTR isolate rule.
 * @param p - selector prefix including trailing space
 */
function rtlMixedText(p: string): string {
    return `
/* --- TEXT: RTL (mixed paragraphs that start with a Latin word) --- */

${p}.${MIXED_CLASS}.${MIXED_CLASS}.${MIXED_CLASS} {
    direction: rtl !important;
    unicode-bidi: isolate !important;
    text-align: right !important;
}
`;
}

/**
 * @param p - selector prefix including trailing space
 */
function ltrOverrides(p: string): string {
    return `
/* --- MUST STAY LTR --- */

/* Modern Cursor code blocks + inline code. isolate keeps a Hebrew string
   inside code from flipping the whole line. */
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

${p}.interactive-result-code-block {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}.interactive-result-editor {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}pre,
${p}code {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}.chat-markdown-part.rendered-markdown table,
${p}.composer-rendered-message .markdown-root table {
    direction: rtl !important;
}

${p}.chat-markdown-part.rendered-markdown table th,
${p}.chat-markdown-part.rendered-markdown table td,
${p}.composer-rendered-message .markdown-root table th,
${p}.composer-rendered-message .markdown-root table td {
    text-align: right !important;
}

${p}.chat-thinking-box {
    direction: ltr !important;
}

${p}.chat-used-context {
    direction: ltr !important;
}

${p}.chat-attached-context,
${p}.chat-attached-context-attachment {
    direction: ltr !important;
}

${p}.interactive-item-container .header {
    direction: ltr !important;
}

${p}.chat-footer-toolbar {
    direction: ltr !important;
}

${p}.interactive-result-code-block-toolbar {
    direction: ltr !important;
}

${p}.interactive-result-vulns {
    direction: ltr !important;
}

${p}.interactive-input-and-execute-toolbar {
    direction: ltr !important;
}

${p}.interactive-input-and-side-toolbar {
    direction: ltr !important;
}

${p}.checkpoint-container,
${p}.checkpoint-restore-container {
    direction: ltr !important;
}

${p}.request-hover {
    direction: ltr !important;
}

/* Composer: code blocks, tools, terminals stay LTR */
${p}.composer-code-block-container,
${p}.composer-diff-block,
${p}.composer-tool-former-message,
${p}.composer-terminal-output,
${p}.composer-tool-call-container,
${p}.ui-step-group-header {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}.composer-rendered-message .monaco-editor,
${p}.composer-message-codeblock {
    direction: ltr !important;
    unicode-bidi: isolate !important;
}
`;
}

/**
 * Per-element opt-in RTL overrides — NOT gated by body.cursor-chat-rtl.
 *
 * - `.composer-message-codeblock.cursor-code-rtl .ui-code-block` —
 *   per-code-block RTL in chat. Specificity (0,3,1) wins over the existing
 *   LTR-forcing rule on `.composer-message-codeblock` (0,2,1).
 */
const OPT_IN_RTL_OVERRIDES = `
/* --- Per-code-block RTL (opt-in via cursor-code-rtl class) --- */
/* Modern anchor (.ui-code-block) first, legacy (.composer-message-codeblock)
   as fallback. Concatenated LAST in RTL_CSS so it wins the global code-LTR
   rule on equal specificity (source order breaks the !important tie). */

.ui-code-block.cursor-code-rtl :is(.ui-default-code, .ui-default-code__line-content),
.composer-message-codeblock.cursor-code-rtl .ui-code-block,
.composer-message-codeblock.cursor-code-rtl .ui-code-block .ui-default-code__line-content {
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

/** The CSS injected for active mode (toggle ⇄ + body class) */
export const RTL_CSS = `/* === CURSOR-CHAT-RTL-START === */
${RTL_MODE_ACTIVE_MARKER}
${BUTTON_CSS}

${rtlLegacyMarkdown(`body.${BODY_CLASS} `)}
${rtlComposerMarkdown(`body.${BODY_CLASS} `)}
${rtlAiMarkdown(`body.${BODY_CLASS} `)}
${rtlQuestionnaire(`body.${BODY_CLASS} `)}
${rtlMixedText(`body.${BODY_CLASS} `)}
${ltrOverrides(`body.${BODY_CLASS} `)}
${OPT_IN_RTL_OVERRIDES}
/* === CURSOR-CHAT-RTL-END === */
`;

/** Options baked into the injected JS (the workbench page cannot read Cursor settings). */
export interface RtlJsOptions {
    /** `cursorChatRtl.mixedTextDetection` — tag Latin-first paragraphs that contain RTL letters. */
    mixedTextDetection: boolean;
}

/** Toggle + localStorage JS */
export function buildRtlJs(options: RtlJsOptions): string {
    return `/* === CURSOR-CHAT-RTL-JS active === */
(function() {
    var BTN_ID = '${BTN_ID}';
    var BODY_CLASS = '${BODY_CLASS}';
    var STORAGE_KEY = 'cursor-chat-rtl-active';
    var MIXED_TEXT = ${options.mixedTextDetection ? 'true' : 'false'};

    // Anchor every lookup inside the Cursor chat/agent panel so the ⇄ button
    // can never land next to a "+" in Terminal, editor tabs, or other panels.
    var CHAT_PANEL_SELECTOR = '#workbench\\\\.parts\\\\.auxiliarybar';

    // Toolbar containers, newest layout first, older fallback second.
    var TOOLBAR_SELECTORS = [
        '.editor-actions .monaco-action-bar > ul.actions-container[aria-label="Editor actions"]',
        '.auxiliary-bar-title-hide-toolbar .monaco-action-bar > ul.actions-container[role="toolbar"]'
    ];

    // Chat-specific command IDs for the "New Chat/Agent" button we anchor next to.
    // Each must be unique to Cursor chat — never reuse a generic id like a plain "add".
    var NEW_CHAT_COMMAND_IDS = [
        'composer.createNewComposerTab',
        'auxiliaryBar.newAgentMenu'
    ];

    function applyBodyClassFromStorage() {
        if (!document.body) return;
        if (localStorage.getItem(STORAGE_KEY) === 'true') {
            document.body.classList.add(BODY_CLASS);
        }
    }

    function findChatPanel() {
        return document.querySelector(CHAT_PANEL_SELECTOR);
    }

    function findToolbar(panel) {
        for (var i = 0; i < TOOLBAR_SELECTORS.length; i++) {
            var c = panel.querySelector(TOOLBAR_SELECTORS[i]);
            if (c) return c;
        }
        return null;
    }

    function findNewChatButton(container) {
        for (var i = 0; i < NEW_CHAT_COMMAND_IDS.length; i++) {
            var li = container.querySelector('li.action-item[data-command-id="' + NEW_CHAT_COMMAND_IDS[i] + '"]');
            if (li) return li;
        }
        return null;
    }

    function tryInsertButton() {
        if (document.getElementById(BTN_ID)) return;

        var panel = findChatPanel();
        if (!panel) return;

        var container = findToolbar(panel);
        if (!container) return;

        var firstLi = findNewChatButton(container);
        if (!firstLi) return;

        var li = document.createElement('li');
        li.className = 'action-item';
        li.setAttribute('role', 'presentation');

        var btn = document.createElement('a');
        btn.id = BTN_ID;
        btn.className = 'action-label';
        btn.textContent = '\\u21C4';
        btn.title = 'Toggle RTL for Cursor Chat';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');

        if (document.body.classList.contains(BODY_CLASS)) {
            btn.classList.add('cursor-rtl-active');
        }

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var isActive = document.body.classList.toggle(BODY_CLASS);
            btn.classList.toggle('cursor-rtl-active', isActive);
            localStorage.setItem(STORAGE_KEY, isActive ? 'true' : 'false');
            if (isActive) scanAllMixed();
        });

        li.appendChild(btn);
        firstLi.insertAdjacentElement('afterend', li);
    }

    // -----------------------------------------------------------------
    // Per-code-block RTL toggle button (Change 3)
    // -----------------------------------------------------------------
    // For each chat code block, inject a toggle button next to the existing
    // Copy button. Click toggles cursor-code-rtl on the closest
    // composer-message-codeblock. Ephemeral — no persistence — because code
    // blocks lack stable identifiers across sessions.

    var CODE_RTL_BTN_CLASS = 'cursor-code-rtl-btn';
    var CODE_RTL_ACTIVE_CLASS = 'cursor-code-rtl';

    function tryInsertCodeBlockButtons() {
        var overlays = document.querySelectorAll('.ui-code-block-copy-overlay');
        for (var i = 0; i < overlays.length; i++) {
            var overlay = overlays[i];
            if (overlay.querySelector('.' + CODE_RTL_BTN_CLASS)) continue;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ui-icon-button ' + CODE_RTL_BTN_CLASS;
            btn.setAttribute('data-variant', 'default');
            btn.setAttribute('data-frame', 'container');
            btn.setAttribute('data-size', 'xs');
            btn.setAttribute('aria-label', 'Toggle RTL for this code block');
            btn.title = 'Toggle RTL for this code block';
            btn.textContent = '\\u21C4';

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var clicked = e.currentTarget;
                // Modern Cursor wraps code in .ui-code-block; older builds used
                // .composer-message-codeblock. Try new first, fall back to old.
                var codeblock = clicked.closest('.ui-code-block') || clicked.closest('.composer-message-codeblock');
                if (!codeblock) return;
                var nowActive = codeblock.classList.toggle(CODE_RTL_ACTIVE_CLASS);
                clicked.classList.toggle('cursor-rtl-active', nowActive);
            });

            overlay.appendChild(btn);
        }
    }

    // -----------------------------------------------------------------
    // Mixed-text detection (setting: cursorChatRtl.mixedTextDetection)
    // -----------------------------------------------------------------
    // CSS gives each paragraph the direction of its FIRST letter, so a
    // Hebrew paragraph that opens with "Cursor" lands LTR. For the paragraphs
    // CSS already targets, add MIXED_CLASS when the text contains an RTL letter
    // but does not start with one; CSS (gated by BODY_CLASS, i.e. the toggle
    // button) then makes it RTL. Cheap by design:
    //   - does nothing while the toggle is off;
    //   - only looks at paragraphs that changed (batched once per frame);
    //   - never re-checks a paragraph that already has MIXED_CLASS;
    //   - its observer ignores attribute changes, so adding the class can't loop.

    var MIXED_CLASS = '${MIXED_CLASS}';
    // U+0590-U+08FF is RTL scripts only: Hebrew (incl. Yiddish), Arabic (Persian, Urdu,
    // Pashto, Sindhi, Kurdish, Uyghur, Balochi...), Syriac, Thaana (Dhivehi), N'Ko,
    // Samaritan, Mandaic. FB1D-FDFF / FE70-FEFE are Hebrew & Arabic presentation forms.
    var RTL_CHARS = '\\u0590-\\u08FF\\uFB1D-\\uFDFF\\uFE70-\\uFEFE';
    var LTR_LETTERS = 'A-Za-z\\u00C0-\\u024F\\u0370-\\u03FF\\u0400-\\u04FF';
    // Any RTL letter anywhere in the text.
    var HAS_RTL = new RegExp('[' + RTL_CHARS + ']');
    // First LETTER is RTL (spaces, digits, punctuation, emoji before it are ignored).
    var STARTS_RTL = new RegExp('^[^' + LTR_LETTERS + RTL_CHARS + ']*[' + RTL_CHARS + ']');

    // Exactly the elements the RTL CSS sets to unicode-bidi: plaintext.
    var BLOCK_TAGS = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, th, td, ' +
        '.ui-markdown__paragraph, .ui-markdown__list-item, .ui-markdown__heading, ' +
        '.ui-markdown__blockquote, .ui-markdown__th, .ui-markdown__td';
    var MIXED_BLOCKS = [
        '[data-message-role="ai"] :is(' + BLOCK_TAGS + ')',
        '.markdown-root :is(' + BLOCK_TAGS + ')',
        '.composer-human-message-container .composer-human-message',
        '.composer-human-message .aislash-editor-input-readonly',
        '.composer-questionnaire-toolbar-title',
        '.composer-questionnaire-toolbar-question',
        '.composer-questionnaire-toolbar-question-label',
        '.composer-questionnaire-toolbar-option',
        '.composer-questionnaire-toolbar-option-label',
        '.composer-questionnaire-toolbar-stepper-label',
        '.questionnaire-answer-text',
        '.questionnaire-answer-value'
    ].join(', ');
    var MIXED_SCOPE = '[data-message-role="ai"], .markdown-root, .composer-human-message, .composer-questionnaire-toolbar';
    // Code renders as LTR isolates, which the browser skips when it picks a
    // paragraph's direction, so skip its text here too.
    var CODE_SEL = 'pre, code, .ui-markdown__inline-code, .ui-code-block';

    function directionText(el) {
        if (!el.querySelector(CODE_SEL)) return el.textContent || '';
        var out = '';
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        var node;
        while ((node = walker.nextNode())) {
            var code = node.parentElement && node.parentElement.closest(CODE_SEL);
            if (code && el.contains(code)) continue;
            out += node.nodeValue;
        }
        return out;
    }

    function checkBlock(el) {
        if (el.classList.contains(MIXED_CLASS)) return;   // already tagged
        var text = directionText(el);
        if (!HAS_RTL.test(text)) return;                  // no RTL letters: leave as is
        if (STARTS_RTL.test(text)) return;                // CSS already handles it
        el.classList.add(MIXED_CLASS);
    }

    function isRtlOn() {
        return !!document.body && document.body.classList.contains(BODY_CLASS);
    }

    var pendingNodes = new Set();
    var flushScheduled = false;

    function queueNode(node) {
        pendingNodes.add(node);
        if (!flushScheduled) {
            flushScheduled = true;
            requestAnimationFrame(flushMixed);
        }
    }

    function flushMixed() {
        flushScheduled = false;
        var nodes = pendingNodes;
        pendingNodes = new Set();
        if (!isRtlOn()) return;
        var blocks = new Set();
        nodes.forEach(function(node) {
            if (!node.isConnected) return;
            var el = node.nodeType === 1 ? node : node.parentElement;
            if (!el) return;
            // The paragraph that contains the change...
            var block = el.closest(MIXED_BLOCKS);
            if (block) blocks.add(block);
            // ...and paragraphs inside a newly added chat subtree.
            if (node.nodeType === 1 && (el.closest(MIXED_SCOPE) || el.querySelector(MIXED_SCOPE))) {
                var inner = el.querySelectorAll(MIXED_BLOCKS);
                for (var i = 0; i < inner.length; i++) blocks.add(inner[i]);
            }
        });
        blocks.forEach(checkBlock);
    }

    function scanAllMixed() {
        if (!MIXED_TEXT || !document.body) return;
        queueNode(document.body);
    }

    function startMixedObserver() {
        if (!MIXED_TEXT) return;
        var observer = new MutationObserver(function(records) {
            if (!isRtlOn()) return;
            for (var i = 0; i < records.length; i++) {
                var r = records[i];
                queueNode(r.target);
                for (var j = 0; j < r.addedNodes.length; j++) {
                    if (r.addedNodes[j].nodeType === 1) queueNode(r.addedNodes[j]);
                }
            }
        });
        // characterData: streamed replies grow text in place.
        // No attributes: our own class changes must not re-trigger us.
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        scanAllMixed();
    }

    function start() {
        applyBodyClassFromStorage();
        tryInsertButton();
        tryInsertCodeBlockButtons();
        var observer = new MutationObserver(function() {
            tryInsertButton();
            tryInsertCodeBlockButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        startMixedObserver();
    }

    if (document.readyState !== 'loading') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
`;
}
