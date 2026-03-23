import type { CursorInstallation } from './finder.js';

/** RTL injection mode */
export type RtlMode = 'inactive' | 'active';

/** RTL installation status for a single Cursor IDE on disk */
export interface RtlStatus {
    installation: CursorInstallation;
    /** Whether RTL CSS/JS are injected into workbench.html */
    isInstalled: boolean;
    /** Detected mode from CSS file markers */
    mode: RtlMode;
    /** Whether workbench.html.bak exists */
    htmlBackupExists: boolean;
    /** Whether product.json.bak exists */
    productBackupExists: boolean;
}
