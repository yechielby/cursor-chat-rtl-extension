import * as vscode from 'vscode';
import { findCursorInstallations } from './finder.js';
import { getStatus } from './injector.js';

let statusBarItem: vscode.StatusBarItem;

export function createStatusBarItem(): vscode.StatusBarItem {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    statusBarItem.command = 'cursor-rtl.toggle';
    statusBarItem.show();
    return statusBarItem;
}

export async function updateStatusBar(): Promise<void> {
    if (!statusBarItem) return;

    const installations = await findCursorInstallations();

    if (installations.length === 0) {
        statusBarItem.text = '$(globe) Cursor Chat RTL: N/A';
        statusBarItem.tooltip = 'Cursor IDE not found on this machine';
        return;
    }

    const statuses = await getStatus(installations);
    const anyInstalled = statuses.some(s => s.isInstalled);

    if (anyInstalled) {
        statusBarItem.text = '$(globe) Cursor Chat RTL: On';
        statusBarItem.tooltip = 'Cursor Chat RTL is active. Click to toggle.';
    } else {
        statusBarItem.text = '$(globe) Cursor Chat RTL: Off';
        statusBarItem.tooltip = 'Cursor Chat RTL is inactive. Click to toggle.';
    }
}

export function disposeStatusBar(): void {
    statusBarItem?.dispose();
}
