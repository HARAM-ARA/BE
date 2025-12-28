import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Add music feature...');

try {
  db.exec('BEGIN TRANSACTION');

  // Add music_request_count column to teams table
  console.log('Step 1: Adding music_request_count column to teams table...');
  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN music_request_count INTEGER DEFAULT 0;
    `);
    console.log('✓ music_request_count column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ music_request_count column already exists');
    } else {
      throw error;
    }
  }

  // Create music_queue table
  console.log('Step 2: Creating music_queue table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS music_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      youtube_url TEXT NOT NULL,
      title TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_team_name TEXT NOT NULL,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ music_queue table created');

  // Create index for faster queue retrieval
  console.log('Step 3: Creating index for music_queue...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_music_queue_requested_at ON music_queue(requested_at);
  `);
  console.log('✓ Index created');

  db.exec('COMMIT');
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
