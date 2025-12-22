import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('Starting migration: student_teams → teams.student_ids...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Add student_ids column if it doesn't exist
  console.log('Step 1: Adding student_ids column to teams table...');
  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN student_ids TEXT DEFAULT '[]';
    `);
    console.log('✓ Column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ Column already exists');
    } else {
      throw error;
    }
  }

  // 2. Add permission_flags and steal_percent columns if they don't exist
  console.log('Step 2: Adding permission_flags and steal_percent columns...');
  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN permission_flags INTEGER DEFAULT 0;
    `);
    console.log('✓ permission_flags column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ permission_flags column already exists');
    } else {
      throw error;
    }
  }

  try {
    db.exec(`
      ALTER TABLE teams ADD COLUMN steal_percent INTEGER DEFAULT 0;
    `);
    console.log('✓ steal_percent column added');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ steal_percent column already exists');
    } else {
      throw error;
    }
  }

  // 3. Check if student_teams table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='student_teams'
  `).get();

  if (tableExists) {
    console.log('Step 3: Migrating data from student_teams to teams.student_ids...');

    // Get all teams
    const teams = db.prepare('SELECT id FROM teams').all();

    for (const team of teams) {
      // Get all students in this team
      const students = db.prepare(`
        SELECT student_id FROM student_teams WHERE team_id = ?
      `).all(team.id);

      const studentIds = students.map(s => s.student_id);

      // Update team with student IDs as JSON
      db.prepare(`
        UPDATE teams SET student_ids = ? WHERE id = ?
      `).run(JSON.stringify(studentIds), team.id);

      console.log(`✓ Migrated ${studentIds.length} students for team ${team.id}`);
    }

    // 4. Drop student_teams table
    console.log('Step 4: Dropping student_teams table...');
    db.exec('DROP TABLE student_teams');
    console.log('✓ Table dropped');

    // 5. Drop related indices
    console.log('Step 5: Dropping student_teams indices...');
    try {
      db.exec('DROP INDEX IF EXISTS idx_student_teams_student_id');
      db.exec('DROP INDEX IF EXISTS idx_student_teams_team_id');
      console.log('✓ Indices dropped');
    } catch (error) {
      console.log('✓ Indices already removed or not found');
    }
  } else {
    console.log('Step 3: student_teams table does not exist, skipping migration');
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
