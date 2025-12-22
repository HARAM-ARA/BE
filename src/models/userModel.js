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
        u.name
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.user_number
    `);
    const students = stmt.all();

    // Get all teams to find which team each student belongs to
    const teamsStmt = db.prepare('SELECT id, student_ids FROM teams');
    const teams = teamsStmt.all();

    // Map student ID to team ID
    const studentTeamMap = {};
    for (const team of teams) {
      const studentIds = JSON.parse(team.student_ids || '[]');
      for (const studentId of studentIds) {
        studentTeamMap[studentId] = team.id;
      }
    }

    // Add teamId to each student
    return students.map(student => ({
      ...student,
      teamId: studentTeamMap[student.id] || null
    }));
  },

  findByUserNumbers(userNumbers) {
    const db = getDatabase();
    const placeholders = userNumbers.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT u.id, u.user_number, u.name, u.role
      FROM users u
      WHERE u.user_number IN (${placeholders})
    `);
    const students = stmt.all(...userNumbers);

    // Get all teams to find which team each student belongs to
    const teamsStmt = db.prepare('SELECT id, student_ids FROM teams');
    const teams = teamsStmt.all();

    // Map student ID to team ID
    const studentTeamMap = {};
    for (const team of teams) {
      const studentIds = JSON.parse(team.student_ids || '[]');
      for (const studentId of studentIds) {
        studentTeamMap[studentId] = team.id;
      }
    }

    // Add team_id to each student
    return students.map(student => ({
      ...student,
      team_id: studentTeamMap[student.id] || null
    }));
  },
};