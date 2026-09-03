import { ipcMain, dialog, BrowserWindow } from 'electron';
import { ProductRepository } from './database/repositories/productRepo';
import { StockRepository } from './database/repositories/stockRepo';
import { AuthRepository, SettingsRepository } from './database/repositories/authRepo';
import { BackupService } from './services/backupService';
import { ImageService } from './services/imageService';
import { getDB } from './database/connection';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // Setup & Auth
  ipcMain.handle('auth:isSetup', () => AuthRepository.isSetupComplete());
  ipcMain.handle('auth:setup', (_, data) => AuthRepository.setupInitialUserAndShop(data));
  ipcMain.handle('auth:login', (_, creds) => AuthRepository.verifyLogin(creds.username, creds.password));
  ipcMain.handle('auth:changePassword', (_, p) => AuthRepository.changePassword(p.username, p.oldPass, p.newPass));

  // Settings
  ipcMain.handle('settings:get', () => SettingsRepository.get());
  ipcMain.handle('settings:update', (_, data) => SettingsRepository.update(data));

  // Products
  ipcMain.handle('products:getAll', (_, opts) => ProductRepository.getAll(opts));
  ipcMain.handle('products:getById', (_, id) => ProductRepository.getById(id));
  ipcMain.handle('products:getByCode', (_, code) => ProductRepository.getByBarcodeOrCode(code));
  ipcMain.handle('products:create', (_, prod) => ProductRepository.create(prod));
  ipcMain.handle('products:update', (_, { id, data }) => ProductRepository.update(id, data));
  ipcMain.handle('products:delete', (_, id) => ProductRepository.delete(id));

  // Stock
  ipcMain.handle('stock:change', (_, change) => StockRepository.changeStock(change));
  ipcMain.handle('stock:getTransactions', (_, opts) => StockRepository.getTransactions(opts));

  // Images
  ipcMain.handle('image:save', (_, { base64, filename }) => ImageService.saveImageFromBase64(base64, filename));
  ipcMain.handle('image:getUri', (_, filename) => ImageService.getImageUri(filename));

  // Categories & Suppliers
  ipcMain.handle('categories:getAll', () => getDB().prepare('SELECT * FROM categories ORDER BY category_name ASC').all());
  ipcMain.handle('categories:create', (_, name) => getDB().prepare('INSERT INTO categories (category_name) VALUES (?)').run(name));
  ipcMain.handle('categories:delete', (_, id) => getDB().prepare('DELETE FROM categories WHERE id = ?').run(id));

  ipcMain.handle('suppliers:getAll', () => getDB().prepare('SELECT * FROM suppliers ORDER BY supplier_name ASC').all());
  ipcMain.handle('suppliers:create', (_, s) => getDB().prepare('INSERT INTO suppliers (supplier_name, phone, address, notes) VALUES (?, ?, ?, ?)').run(s.supplier_name, s.phone, s.address, s.notes));
  ipcMain.handle('suppliers:delete', (_, id) => getDB().prepare('DELETE FROM suppliers WHERE id = ?').run(id));

  // Dashboard Stats
  ipcMain.handle('dashboard:getStats', () => {
    const db = getDB();
    const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as any).c;
    const totalStock = (db.prepare('SELECT SUM(stock_quantity) as s FROM products').get() as any).s || 0;
    const lowStock = (db.prepare('SELECT COUNT(*) as c FROM products WHERE stock_quantity <= minimum_stock AND stock_quantity > 0').get() as any).c;
    const outOfStock = (db.prepare('SELECT COUNT(*) as c FROM products WHERE stock_quantity = 0').get() as any).c;
    const totalValue = (db.prepare('SELECT SUM(stock_quantity * selling_price) as v FROM products').get() as any).v || 0;
    const recentTx = db.prepare(`
      SELECT t.*, p.product_name, p.product_code 
      FROM stock_transactions t JOIN products p ON t.product_id = p.id 
      ORDER BY t.date DESC LIMIT 5
    `).all();

    const categoryBreakdown = db.prepare(`
      SELECT category, COUNT(*) as count, SUM(stock_quantity) as total_stock 
      FROM products GROUP BY category
    `).all();

    return { totalProducts, totalStock, lowStock, outOfStock, totalValue, recentTx, categoryBreakdown };
  });

  // Backup & Restore
  ipcMain.handle('backup:create', async (_, dir) => BackupService.createBackup(dir));
  ipcMain.handle('backup:selectFolder', async () => {
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return res.filePaths[0] || null;
  });
  ipcMain.handle('backup:selectFile', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      filters: [{ name: 'Zip Backup Files', extensions: ['zip'] }],
      properties: ['openFile']
    });
    return res.filePaths[0] || null;
  });
  ipcMain.handle('backup:restore', async (_, zipPath) => BackupService.restoreBackup(zipPath));

  // Load Seed Demo Data
  ipcMain.handle('dev:loadDemoData', () => {
    const db = getDB();
    const sampleCategories = ['Electronics', 'Accessories', 'Office Supplies', 'Beverages'];
    const catStmt = db.prepare('INSERT OR IGNORE INTO categories (category_name) VALUES (?)');
    sampleCategories.forEach(c => catStmt.run(c));

    const sampleProducts = [
      { name: 'Wireless Ergonomic Mouse', code: 'PRD-MOU-01', barcode: '890123450001', cat: 'Accessories', buy: 15.0, sell: 28.5, stock: 42, min: 10 },
      { name: 'Mechanical Keyboard RGB', code: 'PRD-KBD-02', barcode: '890123450002', cat: 'Electronics', buy: 45.0, sell: 79.99, stock: 4, min: 8 },
      { name: 'USB-C Fast Charging Cable 2m', code: 'PRD-CAB-03', barcode: '890123450003', cat: 'Accessories', buy: 2.5, sell: 7.99, stock: 0, min: 15 },
      { name: 'Gel Pen 0.5mm Black Pack of 10', code: 'PRD-PEN-04', barcode: '890123450004', cat: 'Office Supplies', buy: 3.0, sell: 6.5, stock: 120, min: 25 },
      { name: 'Organic Green Tea 100 Bags', code: 'PRD-TEA-05', barcode: '890123450005', cat: 'Beverages', buy: 6.2, sell: 12.0, stock: 18, min: 5 }
    ];

    const insertProd = db.prepare(`
      INSERT OR IGNORE INTO products (product_name, product_code, barcode, category, purchase_price, selling_price, stock_quantity, minimum_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleProducts.forEach(p => insertProd.run(p.name, p.code, p.barcode, p.cat, p.buy, p.sell, p.stock, p.min));
    return { success: true };
  });
                           }
