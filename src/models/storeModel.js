import { getDatabase } from './db.js';

export const storeModel = {
  findAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores');
    return stmt.all();
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO stores (name, price, quantity, image_url, teacher_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(data.name, data.price, data.quantity, data.imageUrl, data.teacherId);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE stores
      SET name = ?, price = ?, quantity = ?, image_url = ?
      WHERE id = ?
    `);
    return stmt.run(data.name, data.price, data.quantity, data.imageUrl, id);
  },

  delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM stores WHERE id = ?');
    return stmt.run(id);
  },
};