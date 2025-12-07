import { getDatabase } from './db.js';

export const wordModel = {
  initWords() {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 초기 단어 데이터가 없으면 샘플 단어 추가
    const count = db.prepare('SELECT COUNT(*) as count FROM words').get().count;
    if (count === 0) {
      this.addSampleWords();
    }
  },

  addSampleWords() {
    const db = getDatabase();
    const sampleWords = [
      '뷁궭긿', '쏙옙', '끯뽥쒁', '낋꼻뻜', '딼쏅끩',
      '꺆궳뺔', '뽰쒕낅', '똻껍뚧', '뀓쐚껨', '뺙꼦뜯',
      '긏뜷쀟', '꽅띜뾴', '깟쑑뺍', '뺨꽦뙿', '슾뗴끃',
      '뺰뛑깨', '깋뿯뻰', '꽋띧뷁', '뫃쓭끧', '뜕솱뺤',
      '꾓쀂뙻', '땡쓔뽜', '뻏꾇뗕', '끈쑔뺬', '뙇쐬뻘',
      '꿏솭뜣', '똕뾤뻣', '깓슌뺙', '뙛쓸뽰', '띃쐴끋'
    ];

    const insert = db.prepare('INSERT OR IGNORE INTO words (word) VALUES (?)');
    const transaction = db.transaction((words) => {
      for (const word of words) {
        insert.run(word);
      }
    });
    transaction(sampleWords);
  },

  getAllWords() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM words').all();
  },

  getRandomWords(count = 5) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM words ORDER BY RANDOM() LIMIT ?').all(count);
  },

  addWord(word) {
    const db = getDatabase();
    const result = db.prepare('INSERT INTO words (word) VALUES (?)').run(word);
    return result.lastInsertRowid;
  },

  deleteWord(id) {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM words WHERE id = ?').run(id);
    return result.changes > 0;
  }
};
