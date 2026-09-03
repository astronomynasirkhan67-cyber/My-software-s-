import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { getDatabasePath, getImageStoragePath } from '../database/connection';

export const BackupService = {
  createBackup: async (targetDirectory?: string): Promise<string> => {
    const zip = new AdmZip();
    const dbPath = getDatabasePath();
    const imagesDir = getImageStoragePath();

    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, 'database');
    }
    if (fs.existsSync(imagesDir)) {
      zip.addLocalFolder(imagesDir, 'product_images');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = targetDirectory || path.dirname(dbPath);
    const backupFile = path.join(outDir, `MyShop_Backup_${timestamp}.zip`);

    zip.writeZip(backupFile);
    return backupFile;
  },

  restoreBackup: async (backupZipPath: string): Promise<boolean> => {
    if (!fs.existsSync(backupZipPath)) throw new Error('Backup file does not exist');
    const zip = new AdmZip(backupZipPath);
    const dbDir = path.dirname(getDatabasePath());
    const imagesDir = getImageStoragePath();

    zip.extractEntryTo('database/inventory.db', dbDir, false, true);
    zip.extractEntryTo('product_images/', imagesDir, false, true);

    return true;
  }
};
