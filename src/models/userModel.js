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

  getAllStudents() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        u.id,
        u.user_number as userId,
        u.name,
        st.team_id as teamId
      FROM users u
      LEFT JOIN student_teams st ON u.id = st.student_id
      WHERE u.role = 'student'
      ORDER BY u.user_number
    `);
    return stmt.all();
  },

  findByUserNumbers(userNumbers) {
    const db = getDatabase();
    const placeholders = userNumbers.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT u.id, u.user_number, u.name, u.role, st.team_id
      FROM users u
      LEFT JOIN student_teams st ON u.id = st.student_id
      WHERE u.user_number IN (${placeholders})
    `);
    return stmt.all(...userNumbers);
  },
};