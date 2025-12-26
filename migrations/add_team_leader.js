import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Add leader_id to teams table...');

try {
  db.exec('BEGIN TRANSACTION');

  // Add leader_id column to teams table
  console.log('Step 1: Adding leader_id column to teams table...');
  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN leader_id INTEGER DEFAULT NULL;
    `);
    console.log('✓ leader_id column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ leader_id column already exists');
    } else {
      throw error;
    }
  }

  // Add foreign key index
  console.log('Step 2: Creating index for leader_id...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
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
