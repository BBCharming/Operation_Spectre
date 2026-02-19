import db from './db.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function fix() {
    const hash = await bcrypt.hash('woo', 10);
    const email = 'bbcharming7@gmail.com';
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user) {
        db.prepare("UPDATE users SET password = ?, role = 'manager', subscription_status = 'active' WHERE email = ?").run(hash, email);
        console.log("✅ Manager Account Updated.");
    } else {
        db.prepare("INSERT INTO users (id, email, password, name, role, subscription_status) VALUES (?, ?, ?, ?, 'manager', 'active')")
          .run(nanoid(), email, hash, 'Agent Benjamin', 'active');
        console.log("✅ Manager Account Created.");
    }
}
fix();
