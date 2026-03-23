import * as fs from 'fs/promises';

/**
 * Check if a path exists (file or directory).
 */
export async function exists(p: string): Promise<boolean> {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}
