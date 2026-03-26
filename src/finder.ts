import * as vscode from 'vscode';
import * as path from 'path';
import { exists } from './utils.js';

/** One `workbench.html` entry (Cursor may ship both sandbox and browser variants). */
export interface WorkbenchEntry {
    workbenchHtmlPath: string;
    checksumKey: string;
}

/**
 * A Cursor **IDE** install on disk (the Electron app).
 * `entries` lists every `workbench.html` that must be patched — Cursor can load either sandbox or browser.
 */
export interface CursorInstallation {
    ideName: string;
    workbenchDir: string;
    productJsonPath: string;
    entries: WorkbenchEntry[];
}

const ELECTRON_DIRS = ['electron-sandbox', 'electron-browser'] as const;

const CHECKSUM_KEYS: Record<string, string> = {
    'electron-sandbox': 'vs/code/electron-sandbox/workbench/workbench.html',
    'electron-browser': 'vs/code/electron-browser/workbench/workbench.html',
};

/**
 * Find the current Cursor installation using `vscode.env.appRoot`.
 * No directory scanning needed — Cursor tells us exactly where it lives.
 */
export async function findCursorInstallations(): Promise<CursorInstallation[]> {
    const resourcesApp = vscode.env.appRoot;

    const productJsonPath = path.join(resourcesApp, 'product.json');
    if (!(await exists(productJsonPath))) return [];

    const workbenchDir = path.join(resourcesApp, 'out', 'vs', 'workbench');
    if (!(await exists(workbenchDir))) return [];

    const entries: WorkbenchEntry[] = [];

    for (const electronDir of ELECTRON_DIRS) {
        const workbenchHtmlPath = path.join(
            resourcesApp,
            'out',
            'vs',
            'code',
            electronDir,
            'workbench',
            'workbench.html',
        );

        if (!(await exists(workbenchHtmlPath))) continue;

        const checksumKey = CHECKSUM_KEYS[electronDir];
        if (!checksumKey) continue;

        entries.push({ workbenchHtmlPath, checksumKey });
    }

    if (entries.length === 0) return [];

    return [{
        ideName: 'Cursor',
        workbenchDir,
        productJsonPath,
        entries,
    }];
}
