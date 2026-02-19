import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database', 'tutor.db');
if (!fs.existsSync(path.dirname(dbPath))) { fs.mkdirSync(path.dirname(dbPath), { recursive: true }); }

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, 
    email TEXT UNIQUE, 
    password TEXT, 
    name TEXT, 
    role TEXT DEFAULT 'student', 
    phone TEXT, 
    subscription_status TEXT DEFAULT 'inactive',
    subscription_expiry DATETIME,
    decline_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY, 
    title TEXT, 
    description TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY, 
    course_id TEXT, 
    title TEXT, 
    filename TEXT, 
    path TEXT, 
    order_idx INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS payment_proofs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    screenshot_path TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
