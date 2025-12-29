import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: Update user roles to include teamleader...');

try {
  db.exec('BEGIN TRANSACTION');

  // Drop the existing check constraint and recreate with teamleader
  console.log('Step 1: Updating role constraint to include teamleader...');
  
  // Create a new table with updated constraint
  db.exec(`
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      user_number TEXT UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'teamleader')),
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Copy data from old table to new table
  db.exec(`
    INSERT INTO users_new (id, email, name, user_number, role, google_id, created_at, updated_at)
    SELECT id, email, name, user_number, role, google_id, created_at, updated_at
    FROM users;
  `);
  
  // Drop old table and rename new table
  db.exec('DROP TABLE users;');
  db.exec('ALTER TABLE users_new RENAME TO users;');
  
  // Recreate indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_user_number ON users(user_number);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);');
  
  // Recreate trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
  
  console.log('✓ Role constraint updated');

  db.exec('COMMIT');
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}