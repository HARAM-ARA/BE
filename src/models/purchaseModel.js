import { getDatabase } from './db.js';

export const purchaseModel = {
  initPurchases() {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (item_id) REFERENCES stores(id)
      )
    `);
    console.log('[Purchase] Table initialized');
  },

  createPurchase(teamId, itemId, quantity, totalPrice) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO purchases (team_id, item_id, quantity, total_price)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(teamId, itemId, quantity, totalPrice);
    return result.lastInsertRowid;
  },

  findByTeam(teamId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT p.*, s.name as item_name
      FROM purchases p
      JOIN stores s ON p.item_id = s.id
      WHERE p.team_id = ?
      ORDER BY p.purchased_at DESC
    `);
    return stmt.all(teamId);
  }
};
