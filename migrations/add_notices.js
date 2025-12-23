import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Add notices table and notice_count...');

try {
  db.exec('BEGIN TRANSACTION');

  // 1. Add notice_count column to teams table
  console.log('Step 1: Adding notice_count column to teams table...');
  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN notice_count INTEGER DEFAULT 0;
    `);
    console.log('✓ notice_count column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ notice_count column already exists');
    } else {
      throw error;
    }
  }

  // 2. Create notices table
  console.log('Step 2: Creating notices table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      is_teacher INTEGER NOT NULL CHECK(is_teacher IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ notices table created');

  // 3. Create trigger for notices
  console.log('Step 3: Creating trigger for notices...');
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_notices_timestamp
    AFTER UPDATE ON notices
    BEGIN
      UPDATE notices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
  console.log('✓ Trigger created');

  db.exec('COMMIT');
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
