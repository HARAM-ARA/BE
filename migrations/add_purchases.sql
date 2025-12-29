-- 팀별 물품 구매 기록 테이블 추가
CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  store_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  total_price REAL NOT NULL CHECK(total_price >= 0),
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (store_item_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchases_team_id ON purchases(team_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_item_id ON purchases(store_item_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON purchases(purchased_at);