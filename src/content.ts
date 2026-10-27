/**
 * CSS/JS injected into the Cursor IDE workbench.
 * Fork: default RTL on, broader Agent/Composer selectors, stronger BiDi.
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
 * Broad RTL for Cursor Agent / Composer markdown (2026 layouts).
 * @param p - selector prefix including trailing space (e.g. "body.cursor-chat-rtl ")
 */
function rtlChatMarkdown(p: string): string {
    return `
/* --- TEXT: RTL (Agent + Composer + legacy) --- */

/* IMPORTANT: do NOT use unicode-bidi: plaintext on paragraphs.
   plaintext picks direction from the first strong character, so a line that
   starts with Latin ("Cursor…", "Reload Window…") flips the whole line to LTR
   and scrambles the following Persian. Force base direction RTL with isolate. */

${p}.markdown-root,
${p}.composer-rendered-message .markdown-root,
${p}.chat-markdown-part.rendered-markdown,
${p}[data-message-role="ai"] .markdown-root,
${p}[data-message-role="human"] .markdown-root,
${p}[data-message-kind="human"] .markdown-root,
${p}[data-message-kind="assistant"] .markdown-root,
${p}[data-message-kind="ai"] .markdown-root {
    direction: rtl !important;
    unicode-bidi: isolate !important;
    text-align: right !important;
}

${p}.markdown-root :is(p, ul, ol, li, h1, h2, h3, h4, h5, h6, blockquote, td, th),
${p}.composer-rendered-message .markdown-root :is(p, ul, ol, li, h1, h2, h3, h4, h5, h6, blockquote, td, th),
${p}.chat-markdown-part.rendered-markdown :is(p, ul, ol, li, h1, h2, h3, h4, h5, h6, blockquote, td, th) {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate !important;
}

/* Inline Latin / links stay readable runs inside the RTL paragraph */
${p}.markdown-root a,
${p}.composer-rendered-message .markdown-root a,
${p}.chat-markdown-part.rendered-markdown a {
    unicode-bidi: isolate !important;
}

${p}.markdown-root :not(pre) > code,
${p}.composer-rendered-message .markdown-root :not(pre) > code,
${p}.chat-markdown-part.rendered-markdown :not(pre) > code {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

/* Human bubbles + composer input */
${p}.composer-human-message-container .composer-human-message,
${p}.composer-human-message .aislash-editor-input-readonly,
${p}[data-message-role="human"],
${p}[data-message-kind="human"] {
    direction: rtl !important;
    unicode-bidi: isolate !important;
    text-align: right !important;
}

${p}.composer-human-message-container .aislash-editor-input-readonly,
${p}.aislash-editor-input-readonly {
    text-align: right !important;
}

${p}.interactive-input-editor .view-lines,
${p}.aislash-editor-input {
    direction: rtl !important;
    text-align: right !important;
}

/* Explicit dir attrs set by injected JS */
${p}.markdown-root[dir="rtl"],
${p}[data-cursor-rtl="1"],
${p}[dir="rtl"] {
    direction: rtl !important;
    text-align: right !important;
    unicode-bidi: isolate !important;
}
`;
}

/**
 * @param p - selector prefix including trailing space
 */
function ltrOverrides(p: string): string {
    return `
/* --- MUST STAY LTR --- */

${p}.interactive-result-code-block,
${p}.interactive-result-editor,
${p}pre,
${p}code,
${p}.composer-code-block-container,
${p}.composer-diff-block,
${p}.composer-tool-former-message,
${p}.composer-terminal-output,
${p}.composer-tool-call-container,
${p}.ui-step-group-header,
${p}.composer-rendered-message .monaco-editor,
${p}.composer-message-codeblock,
${p}[data-message-kind="tool"],
${p}[data-message-role="ai"][data-message-kind="tool"] {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}.markdown-root :is(pre, code),
${p}.composer-rendered-message .markdown-root :is(pre, code),
${p}.chat-markdown-part.rendered-markdown :is(pre, code) {
    direction: ltr !important;
    unicode-bidi: isolate !important;
    text-align: left !important;
}

${p}.chat-markdown-part.rendered-markdown table,
${p}.composer-rendered-message .markdown-root table,
${p}.markdown-root table {
    direction: rtl !important;
}

${p}.chat-markdown-part.rendered-markdown table :is(th, td),
${p}.composer-rendered-message .markdown-root table :is(th, td),
${p}.markdown-root table :is(th, td) {
    text-align: start !important;
}

${p}.chat-thinking-box,
${p}.chat-used-context,
${p}.chat-attached-context,
${p}.chat-attached-context-attachment,
${p}.interactive-item-container .header,
${p}.chat-footer-toolbar,
${p}.interactive-result-code-block-toolbar,
${p}.interactive-result-vulns,
${p}.interactive-input-and-execute-toolbar,
${p}.interactive-input-and-side-toolbar,
${p}.checkpoint-container,
${p}.checkpoint-restore-container,
${p}.request-hover {
    direction: ltr !important;
}
`;
}

/** The CSS injected for active mode (toggle ⇄ + body class) */
export const RTL_CSS = `/* === CURSOR-CHAT-RTL-START === */
${RTL_MODE_ACTIVE_MARKER}
/* fork 0.2.1 — force RTL base dir (no plaintext flip on Latin lead) */
${BUTTON_CSS}

${rtlChatMarkdown(`body.${BODY_CLASS} `)}
${ltrOverrides(`body.${BODY_CLASS} `)}
/* === CURSOR-CHAT-RTL-END === */
`;

/** Toggle + localStorage + dir attributes JS */
export const RTL_JS = `/* === CURSOR-CHAT-RTL-JS active === */
/* fork 0.2.1 */
(function() {
    var BTN_ID = '${BTN_ID}';
    var BODY_CLASS = '${BODY_CLASS}';
    var STORAGE_KEY = 'cursor-chat-rtl-active';

    // Prefer chat/agent panels; also fall back to scanning the whole workbench
    // so Agent-as-editor still gets the ⇄ button.
    var CHAT_PANEL_SELECTORS = [
        '#workbench\\\\.parts\\\\.auxiliarybar',
        '#workbench\\\\.parts\\\\.sidebar',
        '.monaco-workbench'
    ];

    var TOOLBAR_SELECTORS = [
        '.editor-actions .monaco-action-bar > ul.actions-container[aria-label="Editor actions"]',
        '.auxiliary-bar-title-hide-toolbar .monaco-action-bar > ul.actions-container[role="toolbar"]',
        'ul.actions-container[aria-label="Editor actions"]',
        'ul.actions-container[role="toolbar"]'
    ];

    var NEW_CHAT_COMMAND_IDS = [
        'composer.createNewComposerTab',
        'auxiliaryBar.newAgentMenu',
        'composer.createNew',
        'aichat.newchat'
    ];

    var MARKDOWN_ROOT_SELECTOR = [
        '.markdown-root',
        '.composer-rendered-message .markdown-root',
        '.chat-markdown-part.rendered-markdown',
        '[data-message-role="human"]',
        '[data-message-kind="human"]'
    ].join(',');

    // Also force dir=rtl on block children so a Latin-first line cannot flip.
    var BLOCK_SELECTOR = '.markdown-root :is(p, li, h1, h2, h3, h4, h5, h6, blockquote)';

    function isRtlOn() {
        // Default ON unless the user explicitly turned it off.
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    }

    function applyBodyClassFromStorage() {
        if (!document.body) return;
        if (isRtlOn()) {
            document.body.classList.add(BODY_CLASS);
        } else {
            document.body.classList.remove(BODY_CLASS);
        }
        syncButtonState();
        applyDirAttributes();
    }

    function syncButtonState() {
        var btn = document.getElementById(BTN_ID);
        if (!btn) return;
        var on = document.body.classList.contains(BODY_CLASS);
        btn.classList.toggle('cursor-rtl-active', on);
        btn.title = on
            ? 'RTL on — click to switch Cursor Chat to LTR'
            : 'RTL off — click to switch Cursor Chat to RTL';
    }

    function shouldSkip(el) {
        return !!(el.closest && (
            el.closest('pre') ||
            el.closest('[data-message-kind="tool"]') ||
            el.closest('.composer-code-block-container') ||
            el.closest('.composer-tool-call-container') ||
            el.closest('.composer-terminal-output')
        ));
    }

    function setRtl(el, on) {
        if (shouldSkip(el)) return;
        if (on) {
            el.setAttribute('dir', 'rtl');
            el.setAttribute('data-cursor-rtl', '1');
        } else if (el.getAttribute('data-cursor-rtl') === '1') {
            el.removeAttribute('dir');
            el.removeAttribute('data-cursor-rtl');
        }
    }

    function applyDirAttributes() {
        var on = document.body && document.body.classList.contains(BODY_CLASS);
        var roots = document.querySelectorAll(MARKDOWN_ROOT_SELECTOR);
        for (var i = 0; i < roots.length; i++) setRtl(roots[i], on);
        var blocks = document.querySelectorAll(BLOCK_SELECTOR);
        for (var j = 0; j < blocks.length; j++) setRtl(blocks[j], on);
    }

    function findNewChatButton() {
        for (var i = 0; i < NEW_CHAT_COMMAND_IDS.length; i++) {
            var li = document.querySelector('li.action-item[data-command-id="' + NEW_CHAT_COMMAND_IDS[i] + '"]');
            if (li) return li;
        }
        return null;
    }

    function findToolbarNear(li) {
        return li.closest('ul.actions-container') || li.parentElement;
    }

    function tryInsertButton() {
        if (document.getElementById(BTN_ID)) {
            syncButtonState();
            return;
        }

        var firstLi = findNewChatButton();
        if (!firstLi) {
            // Last resort: look inside known panels for any matching toolbar + new-chat.
            for (var p = 0; p < CHAT_PANEL_SELECTORS.length && !firstLi; p++) {
                var panel = document.querySelector(CHAT_PANEL_SELECTORS[p]);
                if (!panel) continue;
                for (var t = 0; t < TOOLBAR_SELECTORS.length && !firstLi; t++) {
                    var container = panel.querySelector(TOOLBAR_SELECTORS[t]);
                    if (!container) continue;
                    for (var c = 0; c < NEW_CHAT_COMMAND_IDS.length; c++) {
                        var li = container.querySelector('li.action-item[data-command-id="' + NEW_CHAT_COMMAND_IDS[c] + '"]');
                        if (li) { firstLi = li; break; }
                    }
                }
            }
        }
        if (!firstLi) return;

        var toolbar = findToolbarNear(firstLi);
        if (!toolbar) return;

        var liBtn = document.createElement('li');
        liBtn.className = 'action-item';
        liBtn.setAttribute('role', 'presentation');

        var btn = document.createElement('a');
        btn.id = BTN_ID;
        btn.className = 'action-label';
        btn.textContent = '\\u21C4';
        btn.title = 'Toggle RTL for Cursor Chat';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isActive = document.body.classList.toggle(BODY_CLASS);
            // Persist explicit choice (including "off").
            localStorage.setItem(STORAGE_KEY, isActive ? 'true' : 'false');
            syncButtonState();
            applyDirAttributes();
        });

        liBtn.appendChild(btn);
        firstLi.insertAdjacentElement('afterend', liBtn);
        syncButtonState();
    }

    function start() {
        applyBodyClassFromStorage();
        tryInsertButton();
        var observer = new MutationObserver(function() {
            tryInsertButton();
            if (document.body && document.body.classList.contains(BODY_CLASS)) {
                applyDirAttributes();
            }
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
