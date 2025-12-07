import { getDatabase } from './db.js';

export const typingGameModel = {
  initGames() {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS typing_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        words TEXT NOT NULL,
        status TEXT DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // next_game_time을 저장할 설정 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS typing_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  createGame(startTime, endTime, words) {
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO typing_games (start_time, end_time, words, status)
      VALUES (?, ?, ?, 'waiting')
    `).run(startTime, endTime, JSON.stringify(words));
    return result.lastInsertRowid;
  },

  getGameById(id) {
    const db = getDatabase();
    const game = db.prepare('SELECT * FROM typing_games WHERE id = ?').get(id);
    if (game && game.words) {
      game.words = JSON.parse(game.words);
    }
    return game;
  },

  getCurrentGame() {
    const db = getDatabase();
    const now = Date.now();
    const game = db.prepare(`
      SELECT * FROM typing_games
      WHERE status = 'active' AND start_time <= ? AND end_time > ?
      ORDER BY id DESC LIMIT 1
    `).get(now, now);

    if (game && game.words) {
      game.words = JSON.parse(game.words);
    }
    return game;
  },

  updateGameStatus(id, status) {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE typing_games SET status = ? WHERE id = ?
    `).run(status, id);
    return result.changes > 0;
  },

  getNextGameTime() {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT value FROM typing_config WHERE key = 'next_game_time'
    `).get();
    return result ? parseInt(result.value, 10) : null;
  },

  setNextGameTime(timestamp) {
    const db = getDatabase();
    db.prepare(`
      INSERT OR REPLACE INTO typing_config (key, value, updated_at)
      VALUES ('next_game_time', ?, CURRENT_TIMESTAMP)
    `).run(timestamp.toString());
  },

  getCurrentGameId() {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT value FROM typing_config WHERE key = 'current_game_id'
    `).get();
    return result ? parseInt(result.value, 10) : null;
  },

  setCurrentGameId(gameId) {
    const db = getDatabase();
    if (gameId === null) {
      db.prepare(`DELETE FROM typing_config WHERE key = 'current_game_id'`).run();
    } else {
      db.prepare(`
        INSERT OR REPLACE INTO typing_config (key, value, updated_at)
        VALUES ('current_game_id', ?, CURRENT_TIMESTAMP)
      `).run(gameId.toString());
    }
  },

  getCurrentGameStartTime() {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT value FROM typing_config WHERE key = 'current_game_start_time'
    `).get();
    return result ? parseInt(result.value, 10) : null;
  },

  setCurrentGameStartTime(timestamp) {
    const db = getDatabase();
    if (timestamp === null) {
      db.prepare(`DELETE FROM typing_config WHERE key = 'current_game_start_time'`).run();
    } else {
      db.prepare(`
        INSERT OR REPLACE INTO typing_config (key, value, updated_at)
        VALUES ('current_game_start_time', ?, CURRENT_TIMESTAMP)
      `).run(timestamp.toString());
    }
  },

  getAllGames() {
    const db = getDatabase();
    const games = db.prepare('SELECT * FROM typing_games ORDER BY id DESC').all();
    return games.map(game => {
      if (game.words) {
        game.words = JSON.parse(game.words);
      }
      return game;
    });
  },

  getGamesByStatus(status) {
    const db = getDatabase();
    const games = db.prepare('SELECT * FROM typing_games WHERE status = ? ORDER BY id DESC').all(status);
    return games.map(game => {
      if (game.words) {
        game.words = JSON.parse(game.words);
      }
      return game;
    });
  },

  // 보상 지급 여부 확인
  isRewardGiven(gameId) {
    const db = getDatabase();
    const result = db.prepare('SELECT reward_given FROM typing_games WHERE id = ?').get(gameId);
    return result ? result.reward_given === 1 : false;
  },

  // 보상 지급 완료 표시
  markRewardGiven(gameId) {
    const db = getDatabase();
    db.prepare('UPDATE typing_games SET reward_given = 1 WHERE id = ?').run(gameId);
  }
};
