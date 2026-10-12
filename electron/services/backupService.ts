import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { getDatabasePath, getImageStoragePath } from '../database/connection';

export const BackupService = {
  createBackup: async (targetDirectory?: string): Promise<string> => {
    const zip = new AdmZip();
    const dbPath = getDatabasePath();
    const imagesDir = getImageStoragePath();

    if (!fs.existsSync(dbPath)) {
      throw new Error('Database file does not exist. Nothing to back up.');
    }

    const outDir = targetDirectory || path.dirname(dbPath);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    zip.addLocalFile(dbPath, 'database');

    if (fs.existsSync(imagesDir)) {
      zip.addLocalFolder(imagesDir, 'product_images');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      outDir,
      `MyShop_Backup_${timestamp}.zip`
    );

    zip.writeZip(backupFile);

    if (!fs.existsSync(backupFile)) {
      throw new Error('Backup file could not be created.');
    }

    return backupFile;
  },

  restoreBackup: async (backupZipPath: string): Promise<boolean> => {
    if (!fs.existsSync(backupZipPath)) {
      throw new Error('Backup file does not exist.');
    }

    const zip = new AdmZip(backupZipPath);
    const entries = zip.getEntries();

    const hasDatabase = entries.some(
      entry => entry.entryName === 'database/inventory.db'
    );

    if (!hasDatabase) {
      throw new Error(
        'Invalid backup: database/inventory.db was not found.'
      );
    }

    const dbPath = getDatabasePath();
    const dbDir = path.dirname(dbPath);
    const imagesDir = getImageStoragePath();

    zip.extractEntryTo(
      'database/inventory.db',
      dbDir,
      false,
      true
    );

    const imageEntries = entries.filter(
      entry => entry.entryName.startsWith('product_images/')
    );

    if (imageEntries.length > 0) {
      zip.extractEntryTo(
        'product_images/',
        imagesDir,
        false,
        true
      );
    }

    return true;
  }
};
