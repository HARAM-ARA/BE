import { getDatabase } from './db.js';

export const userModel = {
  findByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  findByUserNumber(userNumber) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE user_number = ?');
    return stmt.get(userNumber);
  },

  create(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (email, name, role, google_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(data.email, data.name, data.role, data.googleId);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE users
      SET name = ?, role = ?
      WHERE id = ?
    `);
    return stmt.run(data.name, data.role, id);
  },
};