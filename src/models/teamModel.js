import { getDatabase } from './db.js';
import { PERMISSION, hasPermission, grantPermission, revokePermission } from './permissions.js';

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

  findByName(teamName) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM teams WHERE LOWER(name) = LOWER(?)');
    return stmt.get(teamName);
  },

  createTeam(teamName) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO teams (name, team_number, class_number, team_credit)
      VALUES (?, 0, 0, 3000)
    `);
    const result = stmt.run(teamName);
    return result.lastInsertRowid;
  },

  addStudentsToTeam(studentIds, teamId) {
    const db = getDatabase();
    const transaction = db.transaction((students) => {
      const stmt = db.prepare(`
        INSERT INTO student_teams (student_id, team_id)
        VALUES (?, ?)
      `);
      for (const studentId of students) {
        stmt.run(studentId, teamId);
      }
    });
    return transaction(studentIds);
  },

  getAllTeams() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, name, team_credit
      FROM teams
      ORDER BY id ASC
    `);
    return stmt.all();
  },

  updateTeamCredit(teamId, credit) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE teams
      SET team_credit = ?
      WHERE id = ?
    `);
    return stmt.run(credit, teamId);
  },

  swapTeamCredits(teamId1, teamId2) {
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const selectStmt = db.prepare('SELECT id, team_credit FROM teams WHERE id = ?');
      const team1 = selectStmt.get(teamId1);
      const team2 = selectStmt.get(teamId2);

      if (!team1 || !team2) {
        throw new Error('One or both teams not found');
      }

      const updateStmt = db.prepare('UPDATE teams SET team_credit = ? WHERE id = ?');
      updateStmt.run(team2.team_credit, teamId1);
      updateStmt.run(team1.team_credit, teamId2);

      return {
        team1: { id: team1.id, credit: team2.team_credit },
        team2: { id: team2.id, credit: team1.team_credit }
      };
    });
    return transaction();
  },

  // === SWAP 권한 관리 ===
  grantSwapPermission(teamId) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = grantPermission(team.permission_flags || 0, PERMISSION.SWAP);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ? WHERE id = ?');
    return stmt.run(newFlags, teamId);
  },

  hasSwapPermission(teamId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT permission_flags FROM teams WHERE id = ?');
    const result = stmt.get(teamId);
    return result && hasPermission(result.permission_flags || 0, PERMISSION.SWAP);
  },

  revokeSwapPermission(teamId) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = revokePermission(team.permission_flags || 0, PERMISSION.SWAP);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ? WHERE id = ?');
    return stmt.run(newFlags, teamId);
  },

  // === STEAL 권한 관리 ===
  grantStealPermission(teamId, stealPercent) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = grantPermission(team.permission_flags || 0, PERMISSION.STEAL);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ?, steal_percent = ? WHERE id = ?');
    return stmt.run(newFlags, stealPercent, teamId);
  },

  hasStealPermission(teamId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT permission_flags, steal_percent FROM teams WHERE id = ?');
    const result = stmt.get(teamId);
    if (!result) return { hasPermission: false, stealPercent: 0 };

    const hasSteal = hasPermission(result.permission_flags || 0, PERMISSION.STEAL);
    return {
      hasPermission: hasSteal,
      stealPercent: hasSteal ? result.steal_percent : 0
    };
  },

  revokeStealPermission(teamId) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = revokePermission(team.permission_flags || 0, PERMISSION.STEAL);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ?, steal_percent = 0 WHERE id = ?');
    return stmt.run(newFlags, teamId);
  },

  // === ANGER 권한 관리 ===
  grantAngerPermission(teamId) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = grantPermission(team.permission_flags || 0, PERMISSION.ANGER);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ? WHERE id = ?');
    return stmt.run(newFlags, teamId);
  },

  hasAngerPermission(teamId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT permission_flags FROM teams WHERE id = ?');
    const result = stmt.get(teamId);
    return result && hasPermission(result.permission_flags || 0, PERMISSION.ANGER);
  },

  revokeAngerPermission(teamId) {
    const db = getDatabase();
    const team = this.findById(teamId);
    const newFlags = revokePermission(team.permission_flags || 0, PERMISSION.ANGER);
    const stmt = db.prepare('UPDATE teams SET permission_flags = ? WHERE id = ?');
    return stmt.run(newFlags, teamId);
  },

  resetTeamCredit(teamId) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE teams SET team_credit = 3000 WHERE id = ?');
    return stmt.run(teamId);
  },

  stealCredit(stealerTeamId, victimTeamId, stealPercent) {
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const selectStmt = db.prepare('SELECT id, team_credit FROM teams WHERE id = ?');
      const stealerTeam = selectStmt.get(stealerTeamId);
      const victimTeam = selectStmt.get(victimTeamId);

      if (!stealerTeam || !victimTeam) {
        throw new Error('One or both teams not found');
      }

      // 뺏어올 크레딧 계산 (대상 팀 크레딧의 stealPercent%)
      const stolenAmount = Math.floor(victimTeam.team_credit * (stealPercent / 100));

      // 대상 팀에서 차감
      const updateVictimStmt = db.prepare('UPDATE teams SET team_credit = team_credit - ? WHERE id = ?');
      updateVictimStmt.run(stolenAmount, victimTeamId);

      // 뺏는 팀에 추가
      const updateStealerStmt = db.prepare('UPDATE teams SET team_credit = team_credit + ? WHERE id = ?');
      updateStealerStmt.run(stolenAmount, stealerTeamId);

      return {
        stealerTeam: { id: stealerTeam.id, credit: stealerTeam.team_credit + stolenAmount },
        victimTeam: { id: victimTeam.id, credit: victimTeam.team_credit - stolenAmount },
        stolenAmount
      };
    });
    return transaction();
  },
};
