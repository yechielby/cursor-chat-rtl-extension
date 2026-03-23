/**
 * Cursor Chat RTL — modifies the **Cursor IDE** install (workbench.html under the Cursor app).
 * Does not patch VS Code. Finder only discovers Cursor paths.
 */
import * as vscode from 'vscode';
import { findCursorInstallations } from './finder.js';
import { addRtl, removeRtl, getStatus, reinjectAssets, isFullyInstalled } from './injector.js';
import type { RtlMode } from './types.js';
import { createStatusBarItem, updateStatusBar, disposeStatusBar } from './statusBar.js';

const STATE_MODE_KEY = 'cursorRtl.mode';
const STATE_VERSION_KEY = 'cursorRtl.version';

let outputChannel: vscode.OutputChannel;
let globalState: vscode.Memento;
let currentVersion: string;

function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Cursor Chat RTL');
    }
    return outputChannel;
}

async function saveMode(mode: RtlMode): Promise<void> {
    await globalState.update(STATE_MODE_KEY, mode);
}

function getSavedMode(): RtlMode {
    return globalState.get<RtlMode>(STATE_MODE_KEY, 'inactive');
}

/**
 * Workbench HTML/CSS/JS live on disk under the Cursor app — the whole IDE must often be restarted,
 * not only the window, for those files to load reliably.
 */
async function promptRestartIfChanged(changed: boolean): Promise<void> {
    if (!changed) return;
    await updateStatusBar();
    const action = await vscode.window.showInformationMessage(
        'Cursor Chat RTL: Changes will take effect after restarting Cursor.',
        'Quit Now',
        'Later',
    );
    if (action === 'Quit Now') {
        await vscode.commands.executeCommand('workbench.action.quit');
    }
}

async function handleActivate(): Promise<void> {
    const installations = await findCursorInstallations();
    if (installations.length === 0) {
        vscode.window.showWarningMessage('Cursor IDE not found on this machine.');
        return;
    }

    const channel = getOutputChannel();
    channel.clear();
    channel.appendLine('Activating Cursor Chat RTL...\n');

    let anyChanged = false;
    for (const inst of installations) {
        channel.appendLine(`[${inst.ideName}]`);
        const result = await addRtl(inst);
        result.messages.forEach(m => channel.appendLine(m));
        channel.appendLine('');
        if (result.changed) anyChanged = true;
    }

    channel.show(true);
    await saveMode('active');
    await promptRestartIfChanged(anyChanged);

    if (!anyChanged) {
        vscode.window.showInformationMessage('Cursor Chat RTL is already active.');
    }
}

async function handleRemove(): Promise<void> {
    const installations = await findCursorInstallations();
    if (installations.length === 0) {
        vscode.window.showWarningMessage('Cursor IDE not found on this machine.');
        return;
    }

    const channel = getOutputChannel();
    channel.clear();
    channel.appendLine('Deactivating Cursor Chat RTL...\n');

    let anyChanged = false;
    for (const inst of installations) {
        channel.appendLine(`[${inst.ideName}]`);
        const result = await removeRtl(inst);
        result.messages.forEach(m => channel.appendLine(m));
        channel.appendLine('');
        if (result.changed) anyChanged = true;
    }

    channel.show(true);
    await saveMode('inactive');
    await promptRestartIfChanged(anyChanged);

    if (!anyChanged) {
        vscode.window.showInformationMessage('Cursor Chat RTL is already inactive.');
    }
}

async function handleStatus(): Promise<void> {
    const installations = await findCursorInstallations();
    if (installations.length === 0) {
        vscode.window.showWarningMessage('Cursor IDE not found on this machine.');
        return;
    }

    const statuses = await getStatus(installations);
    const channel = getOutputChannel();
    channel.clear();

    channel.appendLine(`IDE: ${vscode.env.appName}`);
    channel.appendLine(`Saved mode: ${getSavedMode()}`);
    channel.appendLine(`Found ${installations.length} Cursor installation(s):\n`);

    for (const s of statuses) {
        channel.appendLine(`  ${s.installation.ideName}`);
        channel.appendLine(`    RTL: ${s.isInstalled ? 'INSTALLED' : 'Not installed'}  (mode: ${s.mode})`);
        channel.appendLine(`    workbench.html backup: ${s.htmlBackupExists ? 'yes' : 'no'}`);
        channel.appendLine(`    product.json backup: ${s.productBackupExists ? 'yes' : 'no'}`);
        channel.appendLine(`    workbench dir: ${s.installation.workbenchDir}`);
        for (const e of s.installation.entries) {
            channel.appendLine(`      • ${e.workbenchHtmlPath}`);
        }
        channel.appendLine('');
    }

    channel.show(true);
    await updateStatusBar();
}

async function saveVersion(): Promise<void> {
    await globalState.update(STATE_VERSION_KEY, currentVersion);
}

async function silentInject(): Promise<boolean> {
    const installations = await findCursorInstallations();
    let anyChanged = false;
    for (const inst of installations) {
        const result = await addRtl(inst);
        if (result.changed) anyChanged = true;
    }
    return anyChanged;
}

async function silentReinjectVersion(): Promise<boolean> {
    const installations = await findCursorInstallations();
    let anyChanged = false;
    for (const inst of installations) {
        const installed = await isFullyInstalled(inst);
        if (!installed) {
            const result = await addRtl(inst);
            if (result.changed) anyChanged = true;
        } else {
            const result = await reinjectAssets(inst);
            if (result.changed) anyChanged = true;
        }
    }
    return anyChanged;
}

/**
 * Keep RTL injected after Cursor updates and refresh assets on extension upgrade.
 */
async function autoReactivate(): Promise<void> {
    const savedVersion = globalState.get<string>(STATE_VERSION_KEY);
    const savedMode = getSavedMode();

    if (!savedVersion) {
        await saveVersion();
        await handleActivate();
        return;
    }

    if (savedMode !== 'active') {
        if (savedVersion !== currentVersion) {
            await saveVersion();
        }
        return;
    }

    if (savedVersion !== currentVersion) {
        await saveVersion();
        await promptRestartIfChanged(await silentReinjectVersion());
        return;
    }

    const installations = await findCursorInstallations();
    if (installations.length === 0) return;

    let needsFull = false;
    for (const inst of installations) {
        if (!(await isFullyInstalled(inst))) {
            needsFull = true;
            break;
        }
    }

    if (needsFull) {
        await promptRestartIfChanged(await silentInject());
    }
}

async function handleToggle(): Promise<void> {
    const installations = await findCursorInstallations();
    if (installations.length === 0) {
        vscode.window.showWarningMessage('Cursor IDE not found on this machine.');
        return;
    }

    const statuses = await getStatus(installations);
    const isOn = statuses.some(s => s.isInstalled);

    if (isOn) {
        const answer = await vscode.window.showInformationMessage(
            'Cursor Chat RTL is active. Do you want to turn it off?',
            'Turn Off',
            'Cancel',
        );
        if (answer === 'Turn Off') {
            await vscode.commands.executeCommand('cursor-rtl.remove');
        }
    } else {
        const answer = await vscode.window.showInformationMessage(
            'Cursor Chat RTL is inactive. Do you want to turn it on?',
            'Turn On',
            'Cancel',
        );
        if (answer === 'Turn On') {
            await vscode.commands.executeCommand('cursor-rtl.add');
        }
    }
}

export function activate(context: vscode.ExtensionContext): void {
    globalState = context.globalState;
    currentVersion = context.extension.packageJSON.version ?? '0.0.0';

    const explained = globalState.get<boolean>('cursorRtl.usageExplained');
    if (!explained) {
        void globalState.update('cursorRtl.usageExplained', true);
        const ch = getOutputChannel();
        ch.appendLine('Cursor Chat RTL — what this does');
        ch.appendLine('This extension patches Cursor\u2019s own workbench files on disk (workbench.html + CSS/JS).');
        ch.appendLine('Installing the extension alone does nothing until you run a command.');
        ch.appendLine('');
        ch.appendLine('Steps: Command Palette (Ctrl+Shift+P) → "Cursor Chat RTL: Activate" → then fully quit Cursor and reopen (Reload Window is not always enough).');
        ch.appendLine('Then open Output → "Cursor Chat RTL" if a command fails (e.g. permission denied).');
        ch.appendLine('');
    }

    const statusBar = createStatusBarItem();
    context.subscriptions.push(statusBar);

    context.subscriptions.push(
        vscode.commands.registerCommand('cursor-rtl.add', handleActivate),
        vscode.commands.registerCommand('cursor-rtl.remove', handleRemove),
        vscode.commands.registerCommand('cursor-rtl.status', handleStatus),
        vscode.commands.registerCommand('cursor-rtl.toggle', handleToggle),
    );

    autoReactivate().catch(err => console.error('Cursor RTL auto-reactivate failed:', err));
    updateStatusBar().catch(err => console.error('Cursor RTL status bar update failed:', err));
}

export function deactivate(): void {
    disposeStatusBar();
    outputChannel?.dispose();
}
