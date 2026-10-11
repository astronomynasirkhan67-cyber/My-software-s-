import bcrypt from 'bcryptjs';
import { getDB } from '../connection';

export const AuthRepository = {
  isSetupComplete: () => {
    const row: any = getDB().prepare('SELECT is_initialized FROM app_settings WHERE id = 1').get();
    return Boolean(row && row.is_initialized === 1);
  },

  setupInitialUserAndShop: (data: { shopName: string; currency: string; username: string; password: string }) => {
    const db = getDB();
    return db.transaction(() => {
      const hash = bcrypt.hashSync(data.password, 10);
      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(data.username, hash);
      db.prepare(`
        UPDATE app_settings
        SET shop_name = ?, currency = ?, is_initialized = 1
        WHERE id = 1
      `).run(data.shopName, data.currency);
      return { success: true };
    })();
  },

  verifyLogin: (username: string, password: string) => {
    const db = getDB();
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) return { success: false, message: 'Invalid username or password' };

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return { success: false, message: 'Invalid username or password' };

    return { success: true, username: user.username, id: user.id };
  },

  changePassword: (username: string, oldPass: string, newPass: string) => {
    const db = getDB();
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) throw new Error('User not found');

    const isValid = bcrypt.compareSync(oldPass, user.password_hash);
    if (!isValid) throw new Error('Current password does not match');

    const newHash = bcrypt.hashSync(newPass, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
    return { success: true };
  }
};

export const SettingsRepository = {
  get: () => {
    return getDB().prepare('SELECT * FROM app_settings WHERE id = 1').get();
  },
  update: (settings: any) => {
    const db = getDB();
    db.prepare(`
      UPDATE app_settings SET
        shop_name = @shop_name,
        shop_address = @shop_address,
        shop_phone = @shop_phone,
        currency = @currency,
        theme = @theme,
        backup_location = @backup_location,
        allow_negative_stock = @allow_negative_stock
      WHERE id = 1
    `).run(settings);
    return { success: true };
  }
};
