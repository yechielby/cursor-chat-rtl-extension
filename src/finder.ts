import * as path from 'path';
import * as fs from 'fs/promises';
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

interface IdeConfig {
    name: string;
    baseDirs: string[];
    electronDirs: string[];
    checksumKeys: Record<string, string>;
}

/**
 * Windows: common folders where the Cursor app may be installed.
 */
function getWindowsCursorBaseDirs(): string[] {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    const candidates = [
        path.join(localAppData, 'Programs', 'cursor'),
        path.join(pf, 'cursor'),
        path.join(pf, 'Cursor'),
        path.join(pf86, 'cursor'),
        path.join(pf86, 'Cursor'),
    ];

    return [...new Set(candidates)];
}

/**
 * Cursor-only IDE configuration for the current platform.
 */
function getCursorConfig(): IdeConfig {
    const platform = process.platform;

    if (platform === 'win32') {
        return {
            name: 'Cursor',
            baseDirs: getWindowsCursorBaseDirs(),
            electronDirs: ['electron-sandbox', 'electron-browser'],
            checksumKeys: {
                'electron-sandbox': 'vs/code/electron-sandbox/workbench/workbench.html',
                'electron-browser': 'vs/code/electron-browser/workbench/workbench.html',
            },
        };
    }

    if (platform === 'darwin') {
        return {
            name: 'Cursor',
            baseDirs: ['/Applications/Cursor.app/Contents'],
            electronDirs: ['electron-sandbox', 'electron-browser'],
            checksumKeys: {
                'electron-sandbox': 'vs/code/electron-sandbox/workbench/workbench.html',
                'electron-browser': 'vs/code/electron-browser/workbench/workbench.html',
            },
        };
    }

    return {
        name: 'Cursor',
        baseDirs: ['/opt/Cursor', '/usr/share/cursor'],
        electronDirs: ['electron-sandbox', 'electron-browser'],
        checksumKeys: {
            'electron-sandbox': 'vs/code/electron-sandbox/workbench/workbench.html',
            'electron-browser': 'vs/code/electron-browser/workbench/workbench.html',
        },
    };
}

/**
 * On Windows, the app may live under a version hash subdirectory.
 */
async function findResourcesApp(baseDir: string): Promise<string | null> {
    const directPath = path.join(baseDir, 'resources', 'app');
    if (await exists(directPath)) {
        return directPath;
    }

    const macPath = path.join(baseDir, 'Resources', 'app');
    if (await exists(macPath)) {
        return macPath;
    }

    try {
        const entries = await fs.readdir(baseDir);
        for (const entry of entries) {
            const subPath = path.join(baseDir, entry, 'resources', 'app');
            if (await exists(subPath)) {
                return subPath;
            }
        }
    } catch {
        /* not readable */
    }

    return null;
}

/**
 * Find Cursor IDE installs. Each install has **all** existing `workbench.html` paths (sandbox + browser when both exist).
 */
export async function findCursorInstallations(): Promise<CursorInstallation[]> {
    const config = getCursorConfig();
    const found: CursorInstallation[] = [];
    const seenResourcesApp = new Set<string>();

    for (const baseDir of config.baseDirs) {
        if (!(await exists(baseDir))) continue;

        const resourcesApp = await findResourcesApp(baseDir);
        if (!resourcesApp) continue;

        if (seenResourcesApp.has(resourcesApp)) continue;
        seenResourcesApp.add(resourcesApp);

        const productJsonPath = path.join(resourcesApp, 'product.json');
        if (!(await exists(productJsonPath))) continue;

        const workbenchDir = path.join(resourcesApp, 'out', 'vs', 'workbench');
        if (!(await exists(workbenchDir))) continue;

        const entries: WorkbenchEntry[] = [];

        for (const electronDir of config.electronDirs) {
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

            const checksumKey = config.checksumKeys[electronDir];
            if (!checksumKey) continue;

            entries.push({ workbenchHtmlPath, checksumKey });
        }

        if (entries.length === 0) continue;

        found.push({
            ideName: config.name,
            workbenchDir,
            productJsonPath,
            entries,
        });
    }

    return found;
}
