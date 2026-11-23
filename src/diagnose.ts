export interface AnchorReport {
    anchor: string;
    hits: number;
    present: boolean;
}

/**
 * Count literal occurrences of each anchor string in the bundle text.
 * Pure + synchronous so it can be reasoned about without touching the filesystem.
 */
export function auditAnchors(bundle: string, anchors: string[]): AnchorReport[] {
    return anchors.map(anchor => {
        const hits = bundle.split(anchor).length - 1;
        return { anchor, hits, present: hits > 0 };
    });
}

/**
 * Anchors the injected CSS/JS relies on. When a future Cursor update breaks
 * RTL, run the diagnose command: a MISSING "current" entry points at the stale
 * selector. "legacy" entries are kept only as a fallback for un-updated Cursor,
 * so 0 hits on a modern Cursor is expected and fine.
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
