import { getDB } from '../connection';

export interface ProductInput {
  product_name: string;
  product_code: string;
  barcode?: string;
  category?: string;
  brand?: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  supplier?: string;
  product_image?: string;
  location?: string;
  notes?: string;
}

export const ProductRepository = {
  getAll: (options?: { search?: string; category?: string; sort?: string; order?: 'asc' | 'desc'; page?: number; limit?: number }) => {
    const db = getDB();
    const { search = '', category = '', sort = 'id', order = 'desc', page = 1, limit = 50 } = options || {};
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM products WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      query += ` AND (product_name LIKE ? OR product_code LIKE ? OR barcode LIKE ? OR brand LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    if (category && category !== 'All') {
      query += ` AND category = ?`;
      params.push(category);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalCount = (db.prepare(countQuery).get(...params) as { count: number }).count;

    const allowedSortColumns = ['id', 'product_name', 'product_code', 'selling_price', 'stock_quantity', 'category'];
    const safeSort = allowedSortColumns.includes(sort) ? sort : 'id';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params);
    return { data: rows, total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  },

  getById: (id: number) => {
    return getDB().prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  getByBarcodeOrCode: (code: string) => {
    return getDB().prepare('SELECT * FROM products WHERE barcode = ? OR product_code = ?').get(code, code);
  },

  create: (prod: ProductInput) => {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO products (
        product_name, product_code, barcode, category, brand, description,
        purchase_price, selling_price, stock_quantity, minimum_stock, supplier,
        product_image, location, notes, updated_at
      ) VALUES (
        @product_name, @product_code, @barcode, @category, @brand, @description,
        @purchase_price, @selling_price, @stock_quantity, @minimum_stock, @supplier,
        @product_image, @location, @notes, CURRENT_TIMESTAMP
      )
    `);

    const result = stmt.run({
      ...prod,
      barcode: prod.barcode || null,
      category: prod.category || 'General',
      brand: prod.brand || '',
      description: prod.description || '',
      supplier: prod.supplier || '',
      product_image: prod.product_image || '',
      location: prod.location || '',
      notes: prod.notes || ''
    });

    // Record initial transaction if initial stock > 0
    if (prod.stock_quantity > 0) {
      db.prepare(`
        INSERT INTO stock_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, unit_price, notes)
        VALUES (?, 'Stock In', ?, 0, ?, ?, 'Initial Stock')
      `).run(result.lastInsertRowid, prod.stock_quantity, prod.stock_quantity, prod.purchase_price);
    }

    return { id: result.lastInsertRowid };
  },

  update: (id: number, prod: Partial<ProductInput>) => {
    const db = getDB();
    const existing: any = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) throw new Error('Product not found');

    const merged = { ...existing, ...prod, barcode: prod.barcode || null };

    db.prepare(`
      UPDATE products SET
        product_name = @product_name,
        product_code = @product_code,
        barcode = @barcode,
        category = @category,
        brand = @brand,
        description = @description,
        purchase_price = @purchase_price,
        selling_price = @selling_price,
        minimum_stock = @minimum_stock,
        supplier = @supplier,
        product_image = @product_image,
        location = @location,
        notes = @notes,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ ...merged, id });

    return { success: true };
  },

  delete: (id: number) => {
    const db = getDB();
    return db.transaction(() => {
      db.prepare('DELETE FROM stock_transactions WHERE product_id = ?').run(id);
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return { success: true };
    })();
  }
};
