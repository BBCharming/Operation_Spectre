import db from './db.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function reboot() {
    const email = 'bbcharming7@gmail.com';
    const pass = 'woo';
    const hash = await bcrypt.hash(pass, 10);
    
    // 1. Remove any broken records
    db.prepare("DELETE FROM users WHERE email = ?").run(email);
    
    // 2. Insert fresh Manager record with all Version 0 columns
    db.prepare(`
        INSERT INTO users (id, email, password, name, role, subscription_status, phone) 
        VALUES (?, ?, ?, ?, 'manager', 'active', '+260771005013')
    `).run(nanoid(), email, hash, 'Agent Benjamin');
    
    console.log("✅ Manager Account Fixed: " + email);
}
reboot();
