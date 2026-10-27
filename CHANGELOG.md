# Changelog

## 0.2.1

- Fix Latin-leading lines flipping to LTR (`Cursor را…`, ``Reload Window`` کافی نیست)
- Drop `unicode-bidi: plaintext` on paragraphs; force RTL base with `isolate` + `text-align: right`
- Set `dir="rtl"` on `p`/`li`/headings so BiDi cannot re-pick from the first English word
- Keep inline `code` as LTR isolated runs inside RTL paragraphs

## 0.2.0

- **Default RTL on** unless the user explicitly turns it off with ⇄
- Broader selectors for current Cursor Agent/Composer (`.markdown-root`, `data-message-role/kind`)
- Inject `dir="rtl"` on live markdown nodes (survives React re-renders via MutationObserver)
- Wider ⇄ button discovery (Agent as editor tab, more New Chat command ids)
- Keep code/tool/terminal blocks LTR
- Fork of `yechielby.cursor-chat-rtl` 0.1.6

## 0.1.6

Upstream: restore ⇄ button on newer Cursor, keep old-version fallback, scope to chat panel.
