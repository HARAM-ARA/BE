import { getDatabase } from './db.js';

export const storeModel = {
  findAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores WHERE deleted = 0');
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
      INSERT INTO stores (name, description, price, quantity, image_url, type, teacher_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.name,
      data.description,
      data.price,
      data.quantity,
      data.imageUrl,
      data.type,
      data.teacherId
    );
    return result.lastInsertRowid;
  },

  findByName(name) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores WHERE name = ?');
    return stmt.get(name);
  },

  update(id, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE stores
      SET name = ?, description = ?, price = ?, quantity = ?, image_url = ?, type = ?
      WHERE id = ?
    `);
    return stmt.run(
      data.name,
      data.description,
      data.price,
      data.quantity,
      data.imageUrl,
      data.type,
      id
    );
  },

  delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE stores SET deleted = 1 WHERE id = ?');
    return stmt.run(id);
  },

  findByIdIncludingDeleted(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ?');
    return stmt.get(id);
  },

  findByType(type) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stores WHERE type = ? AND deleted = 0');
    return stmt.all(type);
  },
};