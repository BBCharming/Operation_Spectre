import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database', 'tutor.db');
if (!fs.existsSync(path.dirname(dbPath))) { fs.mkdirSync(path.dirname(dbPath), { recursive: true }); }

const db = new Database(dbPath);

// Create tables with full schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, 
    email TEXT UNIQUE, 
    password TEXT, 
    name TEXT, 
    role TEXT DEFAULT 'student', 
    phone TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    subscription_status TEXT DEFAULT 'inactive'
  );
  CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT, description TEXT, tutor_name TEXT, price INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, course_id TEXT, title TEXT, room_id TEXT, created_by TEXT);
  CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, course_id TEXT, title TEXT, filename TEXT, path TEXT, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, order_idx INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS quizzes (id TEXT PRIMARY KEY, course_id TEXT, title TEXT);
  CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, quiz_id TEXT, text TEXT, options TEXT, correct_idx INTEGER);
  CREATE TABLE IF NOT EXISTS progress (user_id TEXT, video_id TEXT, percent INTEGER DEFAULT 0, PRIMARY KEY (user_id, video_id));
`);

export default db;
