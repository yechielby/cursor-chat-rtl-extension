import * as fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import type { CursorInstallation, WorkbenchEntry } from './finder.js';
import type { RtlMode, RtlStatus } from './types.js';
import {
    HTML_LINK_MARKER,
    CSS_FILENAME,
    JS_FILENAME,
    RTL_CSS,
    RTL_JS,
    RTL_MODE_ACTIVE_MARKER,
} from './content.js';
import { exists } from './utils.js';

async function isWritable(dir: string): Promise<boolean> {
    try {
        await fs.access(dir, fsConstants.W_OK);
        return true;
    } catch {
        return false;
    }
}

async function htmlHasMarker(htmlPath: string): Promise<boolean> {
    try {
        const content = await fs.readFile(htmlPath, 'utf-8');
        return content.includes(HTML_LINK_MARKER);
    } catch {
        return false;
    }
}

/** True only when every workbench entry has RTL link injected. */
export async function isFullyInstalled(installation: CursorInstallation): Promise<boolean> {
    for (const e of installation.entries) {
        if (!(await htmlHasMarker(e.workbenchHtmlPath))) {
            return false;
        }
    }
    return installation.entries.length > 0;
}

/**
 * Read RTL mode from the injected CSS file on disk.
 */
export async function readModeFromCssFile(installation: CursorInstallation): Promise<RtlMode> {
    const cssPath = path.join(installation.workbenchDir, CSS_FILENAME);
    try {
        const content = await fs.readFile(cssPath, 'utf-8');
        if (content.includes(RTL_MODE_ACTIVE_MARKER)) return 'active';
    } catch {
        /* unreadable */
    }
    return 'inactive';
}

export async function getStatus(installations: CursorInstallation[]): Promise<RtlStatus[]> {
    const statuses: RtlStatus[] = [];

    for (const inst of installations) {
        const htmlOk = await isFullyInstalled(inst);

        statuses.push({
            installation: inst,
            isInstalled: htmlOk,
            mode: htmlOk ? 'active' : 'inactive',
            htmlBackupExists: await Promise.all(
                inst.entries.map(e => exists(e.workbenchHtmlPath + '.bak')),
            ).then(arr => arr.some(Boolean)),
            productBackupExists: await exists(inst.productJsonPath + '.bak'),
        });
    }

    return statuses;
}

async function removeChecksum(installation: CursorInstallation, checksumKey: string, messages: string[]): Promise<void> {
    try {
        const content = await fs.readFile(installation.productJsonPath, 'utf-8');
        const product = JSON.parse(content) as { checksums?: Record<string, string> };

        if (product.checksums && product.checksums[checksumKey]) {
            const backupPath = installation.productJsonPath + '.bak';
            if (!(await exists(backupPath))) {
                await fs.copyFile(installation.productJsonPath, backupPath);
                messages.push(`  product.json: Backup created`);
            }

            delete product.checksums[checksumKey];
            await fs.writeFile(installation.productJsonPath, JSON.stringify(product, null, '\t'), 'utf-8');
            messages.push(`  product.json: Removed checksum for ${checksumKey}`);
        } else {
            messages.push(`  product.json: Checksum already removed or not found (${checksumKey})`);
        }
    } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'EPERM' || err.code === 'EACCES') {
            messages.push(`  product.json: Permission denied: ${installation.productJsonPath}`);
            messages.push('       Try running with elevated privileges');
        } else {
            messages.push(`  product.json: Error: ${err.message}`);
        }
    }
}

async function restoreProductJson(installation: CursorInstallation, messages: string[]): Promise<void> {
    const backupPath = installation.productJsonPath + '.bak';
    if (await exists(backupPath)) {
        try {
            await fs.copyFile(backupPath, installation.productJsonPath);
            await fs.unlink(backupPath);
            messages.push(`  product.json: Restored from backup`);
        } catch (e: unknown) {
            messages.push(`  product.json: Restore failed: ${(e as Error).message}`);
        }
    }
}

async function writeAssets(installation: CursorInstallation, messages: string[]): Promise<void> {
    const cssPath = path.join(installation.workbenchDir, CSS_FILENAME);
    const jsPath = path.join(installation.workbenchDir, JS_FILENAME);
    await fs.writeFile(cssPath, RTL_CSS, 'utf-8');
    await fs.writeFile(jsPath, RTL_JS, 'utf-8');
    messages.push(`  CSS/JS: Written to ${installation.workbenchDir}`);
}

async function injectIntoWorkbenchHtml(
    entry: WorkbenchEntry,
    installation: CursorInstallation,
    messages: string[],
): Promise<boolean> {
    try {
        const htmlBackupPath = entry.workbenchHtmlPath + '.bak';
        if (!(await exists(htmlBackupPath))) {
            await fs.copyFile(entry.workbenchHtmlPath, htmlBackupPath);
            messages.push(`  workbench.html: Backup created (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
        }

        let html = await fs.readFile(entry.workbenchHtmlPath, 'utf-8');

        const cssLinkPattern = /<link[^>]*workbench\.desktop\.main\.css[^>]*>/;
        const cssLinkMatch = html.match(cssLinkPattern);

        if (cssLinkMatch) {
            const insertPos = cssLinkMatch.index! + cssLinkMatch[0].length;
            const cssLink = `\n\t<!-- Cursor Chat RTL Support -->\n\t<link rel="stylesheet" href="../../../workbench/${CSS_FILENAME}">`;
            html = html.substring(0, insertPos) + cssLink + html.substring(insertPos);
        } else {
            const headClose = html.indexOf('</head>');
            if (headClose !== -1) {
                const cssLink = `\t<!-- Cursor Chat RTL Support -->\n\t<link rel="stylesheet" href="../../../workbench/${CSS_FILENAME}">\n`;
                html = html.substring(0, headClose) + cssLink + html.substring(headClose);
            } else {
                messages.push(`  workbench.html: No insertion point in ${entry.workbenchHtmlPath}`);
                return false;
            }
        }

        const htmlClose = html.lastIndexOf('</html>');
        if (htmlClose !== -1) {
            const scriptTag = `\t<!-- Cursor Chat RTL Support -->\n\t<script src="../../../workbench/${JS_FILENAME}"></script>\n`;
            html = html.substring(0, htmlClose) + scriptTag + html.substring(htmlClose);
        }

        await fs.writeFile(entry.workbenchHtmlPath, html, 'utf-8');
        messages.push(`  workbench.html: RTL tags injected (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
        await removeChecksum(installation, entry.checksumKey, messages);
        return true;
    } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'EPERM' || err.code === 'EACCES') {
            messages.push(`  Permission denied: ${entry.workbenchHtmlPath}`);
            messages.push('  Try running Cursor as Administrator once to apply RTL.');
        } else {
            messages.push(`  Error: ${err.message}`);
        }
        return false;
    }
}

/**
 * Install or update RTL assets for a Cursor installation (all workbench entries).
 */
export async function addRtl(
    installation: CursorInstallation,
): Promise<{ messages: string[]; changed: boolean }> {
    const messages: string[] = [];
    let changed = false;

    if (!(await isWritable(installation.workbenchDir))) {
        messages.push(`  Skipped: ${installation.workbenchDir}`);
        messages.push(`       Directory not writable — try running Cursor as Administrator`);
        return { messages, changed: false };
    }

    const allMarked = await isFullyInstalled(installation);

    if (allMarked) {
        const current = await readModeFromCssFile(installation);
        if (current === 'active') {
            messages.push(`  RTL already installed — all workbench.html files patched`);
            return { messages, changed };
        }

        try {
            await writeAssets(installation, messages);
            changed = true;
        } catch (e: unknown) {
            messages.push(`  Error updating CSS/JS: ${(e as Error).message}`);
        }

        return { messages, changed };
    }

    try {
        await writeAssets(installation, messages);
        changed = true;
    } catch (e: unknown) {
        messages.push(`  Error writing CSS/JS: ${(e as Error).message}`);
        return { messages, changed: false };
    }

    for (const entry of installation.entries) {
        if (await htmlHasMarker(entry.workbenchHtmlPath)) {
            messages.push(`  workbench.html: Already has RTL link (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
            continue;
        }
        const ok = await injectIntoWorkbenchHtml(entry, installation, messages);
        if (ok) changed = true;
    }

    return { messages, changed };
}

async function restoreOrStripHtml(entry: WorkbenchEntry, messages: string[]): Promise<boolean> {
    const htmlBackupPath = entry.workbenchHtmlPath + '.bak';

    if (await exists(htmlBackupPath)) {
        try {
            await fs.copyFile(htmlBackupPath, entry.workbenchHtmlPath);
            await fs.unlink(htmlBackupPath);
            messages.push(`  workbench.html: Restored from backup (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
            return true;
        } catch (e: unknown) {
            messages.push(`  workbench.html: Backup restore failed: ${(e as Error).message}`);
        }
    }

    try {
        let html = await fs.readFile(entry.workbenchHtmlPath, 'utf-8');

        html = html.replace(/\n?\t?<!-- Cursor Chat RTL Support -->\n\t<link[^>]*cursor-chat-rtl\.css[^>]*>/g, '');
        html = html.replace(/\n?\t?<!-- Cursor Chat RTL Support -->\n\t<script[^>]*cursor-chat-rtl\.js[^>]*><\/script>\n?/g, '');

        await fs.writeFile(entry.workbenchHtmlPath, html, 'utf-8');
        messages.push(`  workbench.html: RTL tags removed manually (${path.basename(path.dirname(entry.workbenchHtmlPath))})`);
        return true;
    } catch (e: unknown) {
        messages.push(`  workbench.html: Error removing RTL: ${(e as Error).message}`);
        return false;
    }
}

export async function removeRtl(installation: CursorInstallation): Promise<{ messages: string[]; changed: boolean }> {
    const messages: string[] = [];
    let changed = false;

    if (!(await isWritable(installation.workbenchDir))) {
        messages.push(`  Skipped: ${installation.workbenchDir}`);
        messages.push(`       Directory not writable — try running Cursor as Administrator`);
        return { messages, changed: false };
    }

    const anyMarker = (await Promise.all(installation.entries.map(e => htmlHasMarker(e.workbenchHtmlPath)))).some(Boolean);

    if (!anyMarker) {
        messages.push(`  RTL not installed in ${installation.ideName}`);
        return { messages, changed };
    }

    for (const entry of installation.entries) {
        if (await htmlHasMarker(entry.workbenchHtmlPath)) {
            if (await restoreOrStripHtml(entry, messages)) {
                changed = true;
            }
        }
    }

    await restoreProductJson(installation, messages);

    const cssPath = path.join(installation.workbenchDir, CSS_FILENAME);
    const jsPath = path.join(installation.workbenchDir, JS_FILENAME);

    for (const filePath of [cssPath, jsPath]) {
        if (await exists(filePath)) {
            try {
                await fs.unlink(filePath);
                messages.push(`  Deleted: ${path.basename(filePath)}`);
                changed = true;
            } catch (e: unknown) {
                messages.push(`  Error deleting ${path.basename(filePath)}: ${(e as Error).message}`);
            }
        }
    }

    return { messages, changed };
}

/**
 * Re-write CSS/JS assets on disk — useful after Cursor update overwrote workbench.
 */
export async function reinjectAssets(
    installation: CursorInstallation,
): Promise<{ messages: string[]; changed: boolean }> {
    const messages: string[] = [];
    if (!(await isFullyInstalled(installation))) {
        return { messages, changed: false };
    }

    try {
        await writeAssets(installation, messages);
        return { messages, changed: true };
    } catch (e: unknown) {
        messages.push(`  Reinject failed: ${(e as Error).message}`);
        return { messages, changed: false };
    }
}
