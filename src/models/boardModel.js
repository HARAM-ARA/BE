import { getDatabase } from './db.js';

export const boardModel = {
  initBoard() {
    const db = getDatabase();
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS pull_board (
        card_number INTEGER PRIMARY KEY,
        is_pulled INTEGER DEFAULT 0,
        pulled_at DATETIME,
        pulled_by_team_id INTEGER
      )
    `);

    // Check if board is empty (first run)
    const count = db.prepare('SELECT COUNT(*) as count FROM pull_board').get().count;
    if (count === 0) {
      this.resetBoard();
    }
  },

  resetBoard() {
    const db = getDatabase();
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM pull_board').run();
      const insert = db.prepare('INSERT INTO pull_board (card_number) VALUES (?)');
      for (let i = 1; i <= 100; i++) {
        insert.run(i);
      }
    });
    transaction();
  },

  getCardStatus(cardNumber) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM pull_board WHERE card_number = ?').get(cardNumber);
  },

  markCardPulled(cardNumber, teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE pull_board
      SET is_pulled = 1, pulled_at = CURRENT_TIMESTAMP, pulled_by_team_id = ?
      WHERE card_number = ? AND is_pulled = 0
    `);
    const result = stmt.run(teamId, cardNumber);
    return result.changes > 0;
  },

  getPulledCount() {
    const db = getDatabase();
    return db.prepare('SELECT COUNT(*) as count FROM pull_board WHERE is_pulled = 1').get().count;
  },

  isBoardFull() {
    const db = getDatabase();
    const unpulledCount = db.prepare('SELECT COUNT(*) as count FROM pull_board WHERE is_pulled = 0').get().count;
    return unpulledCount === 0;
  }
};
