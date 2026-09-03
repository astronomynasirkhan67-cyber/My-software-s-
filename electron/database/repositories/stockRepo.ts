import { getDB } from '../connection';

export interface StockChangeInput {
  productId: number;
  type: 'Stock In' | 'Stock Out' | 'Adjustment';
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export const StockRepository = {
  changeStock: (input: StockChangeInput) => {
    const db = getDB();
    return db.transaction(() => {
      const product: any = db.prepare('SELECT * FROM products WHERE id = ?').get(input.productId);
      if (!product) throw new Error('Product not found');

      const settings: any = db.prepare('SELECT allow_negative_stock FROM app_settings WHERE id = 1').get();
      const allowNegative = Boolean(settings?.allow_negative_stock);

      let newStock = product.stock_quantity;
      if (input.type === 'Stock In') {
        newStock += input.quantity;
      } else if (input.type === 'Stock Out') {
        if (!allowNegative && product.stock_quantity < input.quantity) {
          throw new Error(`Insufficient stock. Available: ${product.stock_quantity}`);
        }
        newStock -= input.quantity;
      } else if (input.type === 'Adjustment') {
        newStock = input.quantity;
      }

      if (!allowNegative && newStock < 0) {
        throw new Error('Stock cannot be negative.');
      }

      db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newStock, input.productId);

      db.prepare(`
        INSERT INTO stock_transactions (
          product_id, transaction_type, quantity, previous_stock, new_stock, unit_price, notes, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        input.productId,
        input.type,
        input.quantity,
        product.stock_quantity,
        newStock,
        input.unitPrice || 0,
        input.notes || ''
      );

      return { success: true, newStock };
    })();
  },

  getTransactions: (options?: { productId?: number; type?: string; limit?: number }) => {
    const db = getDB();
    let query = `
      SELECT t.*, p.product_name, p.product_code, p.barcode
      FROM stock_transactions t
      JOIN products p ON t.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.productId) {
      query += ` AND t.product_id = ?`;
      params.push(options.productId);
    }
    if (options?.type && options.type !== 'All') {
      query += ` AND t.transaction_type = ?`;
      params.push(options.type);
    }

    query += ` ORDER BY t.date DESC LIMIT ?`;
    params.push(options?.limit || 100);

    return db.prepare(query).all(...params);
  }
};
