# Changelog

All notable changes to **Cursor Chat RTL Support** will be documented in this file.

## [0.1.10] - 2026-11-23

### Added
- **More RTL languages in mixed-paragraph detection.** The detection now covers the whole U+0590–U+08FF block, so Syriac, Dhivehi (Thaana), N'Ko, Samaritan, and Mandaic are recognized alongside Hebrew and Arabic script. Languages written in Hebrew or Arabic script — Urdu, Pashto, Sindhi, Kurdish (Sorani), Uyghur, Balochi, Dari, Yiddish — already worked and still do. The CSS itself was never language-specific.
- Description, keywords, `llms.txt`, and README (all four languages) now name these languages, so their speakers can find the extension.

## [0.1.9] - 2026-11-18

> **Compatibility:** verified against **Cursor 3.31.15** (VS Code 1.128.0).

### Fixed
- **"Cursor IDE not found" in WSL / SSH / Dev Container windows** ([#1](https://github.com/yechielby/cursor-chat-rtl-extension/issues/1)). In a remote window the extension ran on the remote side, where Cursor's app files don't exist. It is now a UI extension (`extensionKind: ["ui"]`), so it always runs locally next to the Cursor install it patches. If an older copy is still installed on the remote, the warning now says so and points to "Install Locally".
- **Hebrew/Arabic/Persian paragraphs that start with an English word rendered LTR** (e.g. `Cursor הוא עורך קוד`). Direction was taken from the first letter only. When RTL is on, the injected script now tags such paragraphs (contains an RTL letter, but its first letter is Latin) with a class that the CSS turns RTL. Paragraphs that start with an RTL letter, and paragraphs with no RTL letters at all, are untouched. Thanks to [#2](https://github.com/yechielby/cursor-chat-rtl-extension/pull/2) for reporting the case.

### Added
- **`cursorChatRtl.mixedTextDetection` setting** (default on) — turns the mixed-paragraph detection off if it misbehaves or slows the chat. Takes effect after Reload Window.

## [0.1.8] - 2026-07-12

> **Compatibility:** verified against **Cursor 3.11.13** (VS Code 1.125.0). Selectors for older Cursor builds are kept as a fallback, so this release also works on versions that have not updated yet.

### Fixed
- **"Your Cursor installation appears to be corrupt" after a Cursor update.** A Cursor update rewrites `product.json` — restoring the `workbench.html` checksum — while leaving the already-patched `workbench.html` in place. The patched HTML then fails the restored checksum. Because the HTML still carried the RTL marker, the extension considered itself fully installed and returned early without ever touching `product.json` again, so it could never heal itself. Activation and asset-reinjection now always re-remove the checksum for any patched `workbench.html`. The `product.json` backup is also refreshed on each patch, so deactivation restores the *current* Cursor's file rather than a stale one.
- **RTL restored for AI responses.** A Cursor update moved AI chat content out of `.composer-rendered-message`, so RTL alignment stopped applying (the ⇄ button appeared but AI text stayed LTR). The extension now anchors on the current `[data-message-role="ai"]` / `.markdown-root` structure — with the old selectors kept as a fallback for un-updated Cursor.
- **Per-code-block ⇄ toggle works again.** The toggle now finds the code block via `.ui-code-block` (its container was renamed from `.composer-message-codeblock`).
- **Code stays LTR reliably.** LTR guards re-anchored on `.ui-code-block` / `.ui-default-code__line-content`, replacing the removed `.composer-code-block-container` / `.composer-diff-block` / `.composer-terminal-output`.

### Added
- **Questions panel RTL** — the full card (title, question, A/B/C/D options, Skip / Continue actions, stepper) now follows RTL, with text auto-directioned by content.
- **`Cursor Chat RTL: Diagnose Selectors` command** — reports which DOM anchors still exist in the installed Cursor, so future breakage can be pinpointed in seconds (Command Palette → search "Diagnose"). It also reports patch health: whether `workbench.html` is patched and whether its checksum was removed — the exact combination behind the "corrupt installation" warning.

### Notes
- AI text direction is automatic **per block**: a block whose text is Hebrew aligns right; a block that is entirely English stays LTR. Code blocks stay LTR until you click their per-block ⇄ toggle.
- All new selectors are additive — old selectors remain as a fallback, so users on older Cursor versions keep working.

## [0.1.7] - 2026-06-12

### Added
- **Questions panel** — Cursor's multiple-choice question prompts (`.composer-questionnaire-toolbar`) now follow RTL when the chat ⇄ toggle is active. The full card — question text, A/B/C/D options, and Skip / Continue actions — is right-aligned.
- **Per-code-block RTL toggle** — Every chat code block now shows a small ⇄ button next to its existing Copy button. Click flips only that single code block to RTL; other code blocks remain LTR. Ephemeral by design — state resets when Cursor reopens, since code blocks lack stable identifiers.

### Notes
- Code blocks, JSON, and terminal output still default to LTR everywhere — the per-code-block toggle is opt-in only.
- The per-code-block toggle works even when the chat ⇄ toggle is off; it targets specific code blocks via a dedicated activation class (`cursor-code-rtl`) independent of the chat-wide `body.cursor-chat-rtl` class.

## [0.1.6] - 2026-04-19

### Fixed
- Restored the ⇄ toggle button on newer Cursor builds. Recent Cursor versions moved the chat toolbar from `.auxiliary-bar-title-hide-toolbar` into `.editor-actions`, and renamed the "New Chat" command id from `auxiliaryBar.newAgentMenu` to `composer.createNewComposerTab` — the injected JS now tries the new selectors first and falls back to the old ones, so users on both old and new Cursor versions see the button.

### Improved
- All DOM lookups for the toggle button are now scoped inside `#workbench.parts.auxiliarybar`, so the ⇄ button can never be injected next to a "+" in the Terminal, editor tabs, or other panels.
- RTL body class is now applied from `localStorage` before attempting to insert the toggle button. If a future Cursor update breaks the toolbar selectors, RTL styling keeps working based on the last saved state — only the button itself is affected until the selectors are updated.

## [0.1.5] - 2026-03-27

### Fixed
- Backup of `workbench.html` is now refreshed every time the extension patches the IDE (including auto-reactivate on startup), ensuring the backup always matches the current Cursor version.
- Activation / deactivation now shows a clear warning when the operation fails, instead of silently reporting success.

### Improved
- `reinjectAssets` skips re-writing CSS/JS files when on-disk content already matches, avoiding unnecessary writes and restarts.

## [0.1.4] - 2026-03-26

### Fixed
- The extension now patches only the Cursor installation it is running in (`vscode.env.appRoot`), instead of scanning all installations on disk. This prevents duplicate patches when multiple Cursor versions are installed side by side.
- Resolved `EPERM` errors caused by scanning protected directories (e.g. `Program Files` on Windows).

### Changed
- Removed all platform-specific directory guessing (Windows / macOS / Linux base dirs) in favor of `vscode.env.appRoot`.
- Added a writability check before attempting to modify IDE files.

## [0.1.0] - 2026-03-23

### Initial Release
Cursor IDE lacks native RTL support in its chat panel — Hebrew, Arabic, and Persian text appears misaligned and hard to read. This extension fixes that by injecting CSS and a small JS toggle into Cursor's workbench files.

- **⇄ Toggle button** added to the Cursor chat toolbar to switch messages to right-aligned RTL.
- **Status-bar indicator** shows the current RTL state at a glance; click to toggle.
- RTL applies only to chat messages — **code blocks and UI elements stay LTR**.
- **Activate / Deactivate / Check Status** commands available from the Command Palette.
- **Auto-reactivate** after Cursor updates overwrite the patched files.
- Automatic backup and restore of original workbench files.
- Supports Windows, macOS, and Linux.
