import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import db from './db.js';

const app = express();
const PORT = 4000;
const JWT_SECRET = 'charming-secret-v0';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try { 
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, name, role, subscription_status, phone, email FROM users WHERE id = ?').get(decoded.id);
        if (!user) return res.status(401).json({ error: 'Invalid' });
        req.user = user; next(); 
    } catch (err) { res.status(403).json({ error: 'Expired' }); }
};

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user });
});
app.get('/api/auth/me', authenticate, (req, res) => res.json(req.user));

// --- MANAGER: USER ROSTER ---
app.get('/api/users', authenticate, (req, res) => {
    if(req.user.role !== 'manager') return res.status(403).send();
    res.json(db.prepare("SELECT id, name, email, subscription_status, phone FROM users WHERE role = 'student'").all());
});

// --- MANAGER: CONTENT MGMT ---
app.get('/api/courses', authenticate, (req, res) => {
    res.json(db.prepare('SELECT * FROM courses').all().map(c => ({...c, videoCount: db.prepare('SELECT COUNT(*) as cnt FROM videos WHERE course_id = ?').get(c.id).cnt})));
});

app.get('/api/courses/:id', authenticate, (req, res) => {
    const c = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    if(c) c.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_idx ASC').all(req.params.id);
    res.json(c);
});

app.put('/api/courses/:id', authenticate, (req, res) => {
    if(req.user.role !== 'manager') return res.status(403).send();
    const { title, description, default_lang, ide_enabled, starter_code } = req.body;
    db.prepare('UPDATE courses SET title = ?, description = ?, default_lang = ?, ide_enabled = ?, starter_code = ? WHERE id = ?')
      .run(title, description, default_lang, ide_enabled ? 1 : 0, starter_code, req.params.id);
    res.json({ success: true });
});

// HARDENED REORDER LOGIC (Absolute Swap)
app.put('/api/videos/reorder', authenticate, (req, res) => {
    if(req.user.role !== 'manager') return res.status(403).send();
    const { videoId, direction } = req.body;
    const cur = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if(!cur) return res.status(404).send();
    const sib = direction === 'up' 
        ? db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx < ? ORDER BY order_idx DESC LIMIT 1').get(cur.course_id, cur.order_idx)
        : db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx > ? ORDER BY order_idx ASC LIMIT 1').get(cur.course_id, cur.order_idx);
    if(sib) {
        db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(sib.order_idx, cur.id);
        db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(cur.order_idx, sib.id);
    }
    res.json({ success: true });
});

app.delete('/api/videos/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.post('/api/compile', authenticate, (req, res) => {
    const { language, code, input } = req.body;
    const workDir = path.join(process.cwd(), 'temp_code', nanoid(10));
    fs.ensureDirSync(workDir);
    fs.writeFileSync(path.join(workDir, 'input.txt'), input || '');
    let cmd = '';
    if (language === 'cpp') {
        fs.writeFileSync(path.join(workDir, 'sol.cpp'), code);
        cmd = `g++ ${path.join(workDir, 'sol.cpp')} -o ${path.join(workDir, 'sol')} && ${path.join(workDir, 'sol')} < ${path.join(workDir, 'input.txt')}`;
    } else if (language === 'java') {
        fs.writeFileSync(path.join(workDir, 'Main.java'), code);
        cmd = `javac ${path.join(workDir, 'Main.java')} && java -cp ${workDir} Main < ${path.join(workDir, 'input.txt')}`;
    } else if (language === 'python') {
        fs.writeFileSync(path.join(workDir, 'script.py'), code);
        cmd = `python3 ${path.join(workDir, 'script.py')} < ${path.join(workDir, 'input.txt')}`;
    }
    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
        const clean = (stdout || stderr || (err ? err.message : "")).replace(new RegExp(process.cwd(), 'g'), "[project]");
        fs.remove(workDir).catch(()=>{});
        res.json({ output: clean });
    });
});

app.listen(PORT, () => console.log('🚀 Version 0 Restoration Active'));
