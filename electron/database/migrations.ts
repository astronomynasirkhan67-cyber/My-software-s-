import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const currentVersionRow = db.prepare('SELECT MAX(version) as version FROM schema_migrations').get() as { version: number | null };
  const currentVersion = currentVersionRow?.version || 0;

  if (currentVersion < 1) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          shop_name TEXT NOT NULL DEFAULT 'My Retail Shop',
          shop_address TEXT DEFAULT '',
          shop_phone TEXT DEFAULT '',
          currency TEXT NOT NULL DEFAULT '$',
          theme TEXT NOT NULL DEFAULT 'dark',
          backup_location TEXT DEFAULT '',
          allow_negative_stock INTEGER NOT NULL DEFAULT 0,
          is_initialized INTEGER NOT NULL DEFAULT 0
        );

        INSERT OR IGNORE INTO app_settings (id, shop_name, currency, is_initialized) VALUES (1, 'My Retail Shop', '$', 0);

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_name TEXT UNIQUE NOT NULL,
          description TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_name TEXT UNIQUE NOT NULL,
          phone TEXT DEFAULT '',
          address TEXT DEFAULT '',
          notes TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_name TEXT NOT NULL,
          product_code TEXT UNIQUE NOT NULL,
          barcode TEXT UNIQUE,
          category TEXT DEFAULT 'General',
          brand TEXT DEFAULT '',
          description TEXT DEFAULT '',
          purchase_price REAL NOT NULL DEFAULT 0.0,
          selling_price REAL NOT NULL DEFAULT 0.0,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          minimum_stock INTEGER NOT NULL DEFAULT 5,
          supplier TEXT DEFAULT '',
          product_image TEXT DEFAULT '',
          location TEXT DEFAULT '',
          notes TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stock_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Stock In', 'Stock Out', 'Adjustment')),
          quantity INTEGER NOT NULL,
          previous_stock INTEGER NOT NULL,
          new_stock INTEGER NOT NULL,
          unit_price REAL DEFAULT 0.0,
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT DEFAULT '',
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
        CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON stock_transactions(product_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON stock_transactions(date);

        INSERT INTO schema_migrations (version) VALUES (1);
      `);
    })();
  }
}
