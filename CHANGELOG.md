# Changelog

All notable changes to **Cursor Chat RTL Support** will be documented in this file.

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
