import { getDatabase } from './db.js';

export const enforceModel = {
  initEnforce() {
    const db = getDatabase();

    // 사용자 진행도 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        current_problem_id INTEGER DEFAULT 1,
        tier INTEGER DEFAULT 0,
        solved_problems INTEGER DEFAULT 0,
        pending_problems INTEGER DEFAULT 0,
        total_brain_power INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 랭크 정보 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS ranks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tier INTEGER NOT NULL,
        tier_name TEXT NOT NULL,
        level INTEGER NOT NULL,
        problems_reward INTEGER NOT NULL,
        brain_power INTEGER NOT NULL,
        success_rate INTEGER NOT NULL
      )
    `);

    // 문제 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        difficulty INTEGER DEFAULT 1,
        problem_order INTEGER NOT NULL
      )
    `);

    console.log('[Enforce] Tables initialized');

    // 랭크 데이터 초기화
    this.initRanks();
  },

  initRanks() {
    const db = getDatabase();
    const count = db.prepare('SELECT COUNT(*) as count FROM ranks').get();

    if (count.count === 0) {
      const ranks = [
        // 브론즈 (tier 0)
        { tier: 0, tier_name: '브론즈', level: 5, problems_reward: 10, brain_power: 100, success_rate: 100 },
        { tier: 0, tier_name: '브론즈', level: 4, problems_reward: 10, brain_power: 100, success_rate: 100 },
        { tier: 0, tier_name: '브론즈', level: 3, problems_reward: 10, brain_power: 100, success_rate: 95 },
        { tier: 0, tier_name: '브론즈', level: 2, problems_reward: 10, brain_power: 100, success_rate: 95 },
        { tier: 0, tier_name: '브론즈', level: 1, problems_reward: 10, brain_power: 100, success_rate: 95 },
        // 실버 (tier 1)
        { tier: 1, tier_name: '실버', level: 5, problems_reward: 20, brain_power: 200, success_rate: 80 },
        { tier: 1, tier_name: '실버', level: 4, problems_reward: 20, brain_power: 200, success_rate: 80 },
        { tier: 1, tier_name: '실버', level: 3, problems_reward: 20, brain_power: 200, success_rate: 80 },
        { tier: 1, tier_name: '실버', level: 2, problems_reward: 20, brain_power: 200, success_rate: 80 },
        { tier: 1, tier_name: '실버', level: 1, problems_reward: 20, brain_power: 200, success_rate: 80 },
        // 골드 (tier 2)
        { tier: 2, tier_name: '골드', level: 5, problems_reward: 30, brain_power: 300, success_rate: 60 },
        { tier: 2, tier_name: '골드', level: 4, problems_reward: 30, brain_power: 300, success_rate: 60 },
        { tier: 2, tier_name: '골드', level: 3, problems_reward: 30, brain_power: 300, success_rate: 60 },
        { tier: 2, tier_name: '골드', level: 2, problems_reward: 30, brain_power: 300, success_rate: 60 },
        { tier: 2, tier_name: '골드', level: 1, problems_reward: 30, brain_power: 300, success_rate: 60 },
        // 플레티넘 (tier 3)
        { tier: 3, tier_name: '플레티넘', level: 5, problems_reward: 40, brain_power: 400, success_rate: 40 },
        { tier: 3, tier_name: '플레티넘', level: 4, problems_reward: 40, brain_power: 400, success_rate: 40 },
        { tier: 3, tier_name: '플레티넘', level: 3, problems_reward: 40, brain_power: 400, success_rate: 40 },
        { tier: 3, tier_name: '플레티넘', level: 2, problems_reward: 40, brain_power: 400, success_rate: 40 },
        { tier: 3, tier_name: '플레티넘', level: 1, problems_reward: 40, brain_power: 400, success_rate: 40 },
        // 다이아 (tier 4)
        { tier: 4, tier_name: '다이아', level: 5, problems_reward: 50, brain_power: 500, success_rate: 20 },
        { tier: 4, tier_name: '다이아', level: 4, problems_reward: 50, brain_power: 500, success_rate: 20 },
        { tier: 4, tier_name: '다이아', level: 3, problems_reward: 50, brain_power: 500, success_rate: 20 },
        { tier: 4, tier_name: '다이아', level: 2, problems_reward: 50, brain_power: 500, success_rate: 20 },
        { tier: 4, tier_name: '다이아', level: 1, problems_reward: 50, brain_power: 500, success_rate: 20 },
        // 루비 (tier 5)
        { tier: 5, tier_name: '루비', level: 5, problems_reward: 60, brain_power: 600, success_rate: 10 },
        { tier: 5, tier_name: '루비', level: 4, problems_reward: 60, brain_power: 600, success_rate: 10 },
        { tier: 5, tier_name: '루비', level: 3, problems_reward: 60, brain_power: 600, success_rate: 10 },
        { tier: 5, tier_name: '루비', level: 2, problems_reward: 60, brain_power: 600, success_rate: 10 },
        { tier: 5, tier_name: '루비', level: 1, problems_reward: 60, brain_power: 600, success_rate: 10 },
      ];

      const stmt = db.prepare(`
        INSERT INTO ranks (tier, tier_name, level, problems_reward, brain_power, success_rate)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const rank of ranks) {
        stmt.run(rank.tier, rank.tier_name, rank.level, rank.problems_reward, rank.brain_power, rank.success_rate);
      }

      console.log('[Enforce] Ranks data initialized');
    }
  },

  // 사용자 진행도 조회
  getUserProgress(userId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_progress WHERE user_id = ?');
    return stmt.get(userId);
  },

  // 사용자 진행도 생성
  createUserProgress(userId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO user_progress (user_id, current_problem_id, tier, solved_problems, pending_problems, total_brain_power)
      VALUES (?, 1, 0, 0, 0, 0)
    `);
    const result = stmt.run(userId);
    return result.lastInsertRowid;
  },

  // 사용자 진행도 업데이트
  updateUserProgress(userId, data) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE user_progress
      SET current_problem_id = ?,
          tier = ?,
          solved_problems = ?,
          pending_problems = ?,
          total_brain_power = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    return stmt.run(
      data.currentProblemId,
      data.tier,
      data.solvedProblems,
      data.pendingProblems,
      data.totalBrainPower,
      userId
    );
  },

  // 랭크 정보 조회
  getRankByTierAndLevel(tier, level) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ranks WHERE tier = ? AND level = ?');
    return stmt.get(tier, level);
  },

  // 모든 랭크 조회
  getAllRanks() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ranks ORDER BY tier ASC, level DESC');
    return stmt.all();
  }
};
