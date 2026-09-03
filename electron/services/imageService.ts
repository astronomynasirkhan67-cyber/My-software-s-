import fs from 'fs';
import path from 'path';
import { getImageStoragePath } from '../database/connection';

export const ImageService = {
  saveImageFromBase64: (base64Data: string, originalName: string): string => {
    const storagePath = getImageStoragePath();
    const extension = path.extname(originalName) || '.png';
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${extension}`;
    const targetFile = path.join(storagePath, fileName);

    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(targetFile, Buffer.from(base64Image, 'base64'));

    return fileName;
  },

  getImageUri: (fileName: string): string => {
    if (!fileName) return '';
    const filePath = path.join(getImageStoragePath(), fileName);
    if (!fs.existsSync(filePath)) return '';
    const data = fs.readFileSync(filePath);
    const ext = path.extname(fileName).replace('.', '') || 'png';
    return `data:image/${ext};base64,${data.toString('base64')}`;
  }
};
