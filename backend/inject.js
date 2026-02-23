import db from './db.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

async function seed() {
    const pass = await bcrypt.hash('admin123', 10);
    try {
        db.prepare("INSERT INTO users (id, email, password, name, role, subscription_status) VALUES (?, ?, ?, ?, ?, ?)")
          .run(nanoid(), 'admin@thecharmingprogrammer.com', pass, 'Benjamin (Manager)', 'manager', 'active');
        console.log("✅ Manager Account Created: admin@thecharmingprogrammer.com / admin123");
    } catch(e) {
        console.log("ℹ️ Manager already exists.");
    }
}
seed();
