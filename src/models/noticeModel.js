import { getDatabase } from './db.js';

export const noticeModel = {
  createNotice(title, content, author, isTeacher) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO notices (title, content, author, is_teacher)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(title, content, author, isTeacher ? 1 : 0);
    return result.lastInsertRowid;
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM notices WHERE id = ?');
    return stmt.get(id);
  },

  getAllNotices() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM notices
      ORDER BY created_at DESC
    `);
    return stmt.all();
  },
};
