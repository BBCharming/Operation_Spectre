import db from './db.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function reboot() {
    const email = 'benjamin@thecharmingprogrammer.com';
    const pass = 'The 1 that created me';
    const hash = await bcrypt.hash(pass, 10);
    db.prepare("DELETE FROM users WHERE email = ?").run(email);
    db.prepare("DELETE FROM users WHERE email = 'admin@thecharmingprogrammer.com'").run(); // Clean up old
    db.prepare("INSERT INTO users (id, email, password, name, role, subscription_status) VALUES (?, ?, ?, ?, 'manager', 'active')")
      .run(nanoid(), email, hash, 'Benjamin');
    console.log("✅ Identity Updated: " + email);
}
reboot();
