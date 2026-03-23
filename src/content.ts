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

/** The CSS injected for active mode (toggle ⇄ + body class) */
export const RTL_CSS = `/* === CURSOR-CHAT-RTL-START === */
${RTL_MODE_ACTIVE_MARKER}
${BUTTON_CSS}

${rtlLegacyMarkdown(`body.${BODY_CLASS} `)}
${rtlComposerMarkdown(`body.${BODY_CLASS} `)}
${ltrOverrides(`body.${BODY_CLASS} `)}
/* === CURSOR-CHAT-RTL-END === */
`;

/** Toggle + localStorage JS */
export const RTL_JS = `/* === CURSOR-CHAT-RTL-JS active === */
(function() {
    var BTN_ID = '${BTN_ID}';
    var BODY_CLASS = '${BODY_CLASS}';
    var STORAGE_KEY = 'cursor-chat-rtl-active';

    function findToolbar() {
        var hideToolbar = document.querySelector('.auxiliary-bar-title-hide-toolbar');
        if (!hideToolbar) return null;

        var container = hideToolbar.querySelector('.monaco-action-bar > ul.actions-container[role="toolbar"]');
        if (!container) return null;

        return container;
    }

    function tryInsertButton() {
        if (document.getElementById(BTN_ID)) return;

        var container = findToolbar();
        if (!container) return;

        var firstLi = container.querySelector('li.action-item[data-command-id="auxiliaryBar.newAgentMenu"]');
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

        li.appendChild(btn);

        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'true') {
            document.body.classList.add(BODY_CLASS);
            btn.classList.add('cursor-rtl-active');
        }

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var isActive = document.body.classList.toggle(BODY_CLASS);
            btn.classList.toggle('cursor-rtl-active', isActive);
            localStorage.setItem(STORAGE_KEY, isActive ? 'true' : 'false');
        });

        firstLi.insertAdjacentElement('afterend', li);
    }

    var observer = new MutationObserver(function() {
        tryInsertButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    if (document.readyState !== 'loading') {
        tryInsertButton();
    } else {
        document.addEventListener('DOMContentLoaded', tryInsertButton);
    }
})();
`;
