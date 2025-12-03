import Database from 'better-sqlite3';
import { config } from '../config/index.js';

let db;

export function initDatabase() {
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

export function getDatabase() {
  if (!db) {
    db = initDatabase();
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}