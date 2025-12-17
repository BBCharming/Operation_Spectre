import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { nanoid } from 'nanoid';
import fs from 'fs';
const dbPath = path.join(process.cwd(), 'database/tutor.db');
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, role TEXT, phone TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, subscription_status TEXT DEFAULT 'inactive');`);
const EMAIL = 'bbcharming7@gmail.com'; const PASS = 'woo';
async function fix() {
    const hash = await bcrypt.hash(PASS, 10);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(EMAIL);
    if (user) { db.prepare('UPDATE users SET password = ?, role = "manager" WHERE email = ?').run(hash, EMAIL); console.log("Admin Updated."); }
    else { db.prepare('INSERT INTO users (id, email, password, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)').run(nanoid(), EMAIL, hash, 'Agent Benjamin', 'manager', '0966666666'); console.log("Admin Created."); }
}
fix();
