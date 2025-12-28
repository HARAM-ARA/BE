import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Add requester_id and requester_team_id to music_queue...');

try {
  db.exec('BEGIN TRANSACTION');

  // Add requester_id column
  console.log('Step 1: Adding requester_id column to music_queue table...');
  try {
    db.exec(`
      ALTER TABLE music_queue ADD COLUMN requester_id INTEGER;
    `);
    console.log('✓ requester_id column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ requester_id column already exists');
    } else {
      throw error;
    }
  }

  // Add requester_team_id column
  console.log('Step 2: Adding requester_team_id column to music_queue table...');
  try {
    db.exec(`
      ALTER TABLE music_queue ADD COLUMN requester_team_id INTEGER;
    `);
    console.log('✓ requester_team_id column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ requester_team_id column already exists');
    } else {
      throw error;
    }
  }

  db.exec('COMMIT');
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
