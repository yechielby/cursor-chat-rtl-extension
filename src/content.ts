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
 * Cursor Questions panel (`.composer-questionnaire-toolbar`).
 * @param p - selector prefix including trailing space
 */
function rtlQuestionnaire(p: string): string {
    return `
/* --- TEXT: RTL (Questions panel) --- */

${p}.composer-questionnaire-toolbar {
    direction: rtl !important;
}
`;
}

/**
 * @param p - selector prefix including trailing space
 */
function ltrOverrides(p: string): string {
    return `
/* --- MUST STAY LTR --- */

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
 * These rules fire whenever a specific element has the activation class,
 * independent of the chat-wide RTL toggle.
 *
 * - `.editor-container.cursor-md-rtl` (markdown editor) — flips text direction
 *   for both the Markdown source view (`.view-lines`) and Cursor's inline
 *   Preview view (`.markdown-editor-react`). One toggle covers both modes.
 *   Activated by the ⇄ button injected into the Markdown breadcrumb tabs
 *   (next to Preview/Markdown).
 * - `.composer-message-codeblock.cursor-code-rtl .ui-code-block` —
 *   per-code-block RTL in chat. Specificity (0,3,1) wins over the existing
 *   LTR-forcing rule on `.composer-message-codeblock` (0,2,1).
 */
const OPT_IN_RTL_OVERRIDES = `
/* --- Per-file Markdown editor RTL (opt-in via cursor-md-rtl class) --- */
/*    Covers both Cursor's inline Preview (.markdown-editor-react) and the    */
/*    raw Monaco source view (.view-lines).                                   */

.editor-container.cursor-md-rtl .markdown-editor-react,
.editor-container.cursor-md-rtl .view-lines {
    direction: rtl !important;
    text-align: right !important;
}

/* --- Per-code-block RTL (opt-in via cursor-code-rtl class) --- */

.composer-message-codeblock.cursor-code-rtl .ui-code-block,
.composer-message-codeblock.cursor-code-rtl .ui-code-block .ui-default-code__line-content {
    direction: rtl !important;
    text-align: right !important;
}

/* --- Toggle-button active state (shared by md and code-block toggles) --- */
/*    The MD button uses Cursor's .markdown-mode-tab class for base styling   */
/*    and only needs an "active" visual; the code-block button reuses         */
/*    Cursor's .ui-icon-button base.                                          */

.cursor-md-rtl-btn.cursor-rtl-active,
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
${rtlQuestionnaire(`body.${BODY_CLASS} `)}
${ltrOverrides(`body.${BODY_CLASS} `)}
${OPT_IN_RTL_OVERRIDES}
/* === CURSOR-CHAT-RTL-END === */
`;

/** Toggle + localStorage JS */
export const RTL_JS = `/* === CURSOR-CHAT-RTL-JS active === */
(function() {
    var BTN_ID = '${BTN_ID}';
    var BODY_CLASS = '${BODY_CLASS}';
    var STORAGE_KEY = 'cursor-chat-rtl-active';

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
        });

        li.appendChild(btn);
        firstLi.insertAdjacentElement('afterend', li);
    }

    // -----------------------------------------------------------------
    // MD editor RTL toggle button (Change 2)
    // -----------------------------------------------------------------
    // For every Markdown breadcrumb-controls strip (the [Preview][Markdown]
    // switcher in the editor title bar), inject a third toggle button next
    // to them. Click toggles cursor-md-rtl on the enclosing .editor-container,
    // and the CSS rule flips both the Monaco source view (.view-lines) and
    // the inline Preview (.markdown-editor-react). State is persisted per
    // file in localStorage, identified by the file path from the file
    // breadcrumb item's aria-label.

    var MD_RTL_STORAGE_PREFIX = 'cursor-md-rtl:';
    var MD_RTL_BTN_CLASS = 'cursor-md-rtl-btn';
    var MD_RTL_ACTIVE_CLASS = 'cursor-md-rtl';

    var MD_BREADCRUMB_CONTROLS_SELECTOR =
        '.title .breadcrumbs-row [data-markdown-breadcrumb-controls="true"]';

    function getMdFileId(controlsEl) {
        // First try the file breadcrumb item's aria-label (e.g. an absolute
        // file path). This exists in both Markdown and Preview modes and is
        // stable per file.
        var titleEl = controlsEl.closest('.title');
        if (titleEl) {
            var fileLabel = titleEl.querySelector(
                '.breadcrumbs-row .file.monaco-breadcrumb-item .monaco-icon-label'
            );
            if (fileLabel) {
                var aria = fileLabel.getAttribute('aria-label');
                if (aria) return aria;
            }
        }
        // Fallback: try the Monaco data-uri (only present in source mode).
        var container = controlsEl.closest('.editor-container');
        if (container) {
            var monaco = container.querySelector('.monaco-editor[data-uri]');
            if (monaco) {
                var uri = monaco.getAttribute('data-uri');
                if (uri) return uri;
            }
        }
        return '';
    }

    function tryInsertMdEditorButtons() {
        var controlsList = document.querySelectorAll(MD_BREADCRUMB_CONTROLS_SELECTOR);
        for (var i = 0; i < controlsList.length; i++) {
            var controls = controlsList[i];
            var tabsContainer = controls.querySelector('.markdown-mode-tabs');
            if (!tabsContainer) continue;
            if (tabsContainer.querySelector('.' + MD_RTL_BTN_CLASS)) continue;

            var editorContainer = controls.closest('.editor-container');
            if (!editorContainer) continue;

            var fileId = getMdFileId(controls);

            // Restore persisted state for this file onto the editor-container.
            if (fileId && localStorage.getItem(MD_RTL_STORAGE_PREFIX + fileId) === 'true') {
                editorContainer.classList.add(MD_RTL_ACTIVE_CLASS);
            }

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'markdown-mode-tab ' + MD_RTL_BTN_CLASS;
            btn.title = 'Toggle RTL for this Markdown file';
            btn.textContent = '\\u21C4';

            if (editorContainer.classList.contains(MD_RTL_ACTIVE_CLASS)) {
                btn.classList.add('cursor-rtl-active');
            }

            (function bindClick(boundContainer, boundFileId, boundBtn) {
                boundBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    var nowActive = boundContainer.classList.toggle(MD_RTL_ACTIVE_CLASS);
                    boundBtn.classList.toggle('cursor-rtl-active', nowActive);
                    if (boundFileId) {
                        localStorage.setItem(
                            MD_RTL_STORAGE_PREFIX + boundFileId,
                            nowActive ? 'true' : 'false'
                        );
                    }
                });
            })(editorContainer, fileId, btn);

            tabsContainer.appendChild(btn);
        }
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
                var codeblock = clicked.closest('.composer-message-codeblock');
                if (!codeblock) return;
                var nowActive = codeblock.classList.toggle(CODE_RTL_ACTIVE_CLASS);
                clicked.classList.toggle('cursor-rtl-active', nowActive);
            });

            overlay.appendChild(btn);
        }
    }

    function start() {
        applyBodyClassFromStorage();
        tryInsertButton();
        tryInsertMdEditorButtons();
        tryInsertCodeBlockButtons();
        var observer = new MutationObserver(function() {
            tryInsertButton();
            tryInsertMdEditorButtons();
            tryInsertCodeBlockButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState !== 'loading') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
`;
