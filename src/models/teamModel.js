import { getDatabase } from './db.js';

export const teamModel = {
  findByTeamNumber(teamNumber, classNumber) {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM teams WHERE team_number = ? AND class_number = ?'
    );
    return stmt.get(teamNumber, classNumber);
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM teams WHERE id = ?');
    return stmt.get(id);
  },

  create(data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO teams (team_number, class_number, name)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(
      data.teamNumber,
      data.classNumber,
      data.name || `Team ${data.teamNumber}`
    );
    return result.lastInsertRowid;
  },

  findStudentTeam(studentId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM student_teams WHERE student_id = ?');
    return stmt.get(studentId);
  },

  addStudentToTeam(studentId, teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO student_teams (student_id, team_id)
      VALUES (?, ?)
    `);
    return stmt.run(studentId, teamId);
  },

  bulkAddStudentsToTeams(students) {
    const db = getDatabase();
    const transaction = db.transaction((studentList) => {
      const stmt = db.prepare(`
        INSERT INTO student_teams (student_id, team_id)
        VALUES (?, ?)
      `);
      for (const student of studentList) {
        stmt.run(student.studentId, student.teamId);
      }
    });
    return transaction(students);
  },

  getTeamMembers(teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT u.id, u.email, u.name, st.team_id
      FROM student_teams st
      JOIN users u ON st.student_id = u.id
      WHERE st.team_id = ?
    `);
    return stmt.all(teamId);
  },

  isStudentInTeam(studentId, teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM student_teams
      WHERE student_id = ? AND team_id = ?
    `);
    const result = stmt.get(studentId, teamId);
    return result.count > 0;
  },

  assignStudentToTeam(studentId, teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO student_teams (student_id, team_id)
      VALUES (?, ?)
    `);
    return stmt.run(studentId, teamId);
  },
};
