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
const uploadPath = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadPath);
app.use('/uploads', express.static(uploadPath));

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (err) { res.status(403).json({ error: 'Invalid' }); }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
    next();
};

// COMPILER ENGINE (Sanitized for Version 0)
app.post('/api/compile', authenticate, (req, res) => {
    const { language, code, input } = req.body;
    const workDir = path.join(process.cwd(), 'temp_code', nanoid(10));
    fs.ensureDirSync(workDir);
    const inputFile = path.join(workDir, 'input.txt');
    fs.writeFileSync(inputFile, input || '');
    let cmd = '';
    if (language === 'cpp') {
        fs.writeFileSync(path.join(workDir, 'sol.cpp'), code);
        cmd = `g++ ${path.join(workDir, 'sol.cpp')} -o ${path.join(workDir, 'sol')} && ${path.join(workDir, 'sol')} < ${inputFile}`;
    } else if (language === 'java') {
        fs.writeFileSync(path.join(workDir, 'Main.java'), code);
        cmd = `javac ${path.join(workDir, 'Main.java')} && java -cp ${workDir} Main < ${inputFile}`;
    }
    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
        let raw = stdout || stderr || (err ? err.message : "");
        const clean = raw.replace(new RegExp(process.cwd(), 'g'), "[project]");
        fs.remove(workDir).catch(()=>{});
        res.json({ output: clean });
    });
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, phone } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    try {
        const id = nanoid();
        db.prepare('INSERT INTO users (id, email, password, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)').run(id, email, hashed, name, 'student', phone || '');
        const token = jwt.sign({ id, email, role: 'student', name }, JWT_SECRET);
        res.json({ token, user: { id, email, name, role: 'student' } });
    } catch (e) { res.status(400).json({ error: 'User already exists' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, subscription_status: user.subscription_status }, JWT_SECRET);
    res.json({ token, user });
});

app.get('/api/auth/me', authenticate, (req, res) => {
    res.json(db.prepare('SELECT id, email, name, role, subscription_status FROM users WHERE id = ?').get(req.user.id));
});

// MANAGER TOOLS
app.get('/api/users', authenticate, requireRole('manager'), (req, res) => {
    res.json(db.prepare("SELECT id, name, email, subscription_status, phone FROM users WHERE role = 'student'").all());
});

app.post('/api/users/:id/approve', authenticate, requireRole('manager'), (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'active' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

app.post('/api/users/:id/revoke', authenticate, requireRole('manager'), (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

app.get('/api/stats', authenticate, requireRole('manager'), (req, res) => {
    res.json({
        students: db.prepare('SELECT COUNT(*) as count FROM users WHERE role="student"').get().count,
        courses: db.prepare('SELECT COUNT(*) as count FROM courses').get().count,
        videos: db.prepare('SELECT COUNT(*) as count FROM videos').get().count
    });
});

// CONTENT
app.get('/api/courses', (req, res) => {
    res.json(db.prepare('SELECT * FROM courses').all().map(c => ({...c, videoCount: db.prepare('SELECT COUNT(*) as cnt FROM videos WHERE course_id = ?').get(c.id).cnt})));
});

app.get('/api/courses/:id', authenticate, (req, res) => {
    const c = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    c.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_idx ASC').all(req.params.id);
    c.isSubscriber = (req.user.role === 'manager' || req.user.subscription_status === 'active');
    res.json(c);
});

app.post('/api/courses', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('INSERT INTO courses (id, title, description, tutor_name) VALUES (?, ?, ?, ?)').run(nanoid(), req.body.title, req.body.description || '', req.user.name);
    res.json({ success: true });
});

app.put('/api/courses/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('UPDATE courses SET title = ?, description = ? WHERE id = ?').run(req.body.title, req.body.description, req.params.id);
    res.json({ success: true });
});

app.delete('/api/courses/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM videos WHERE course_id = ?').run(req.params.id);
    res.json({ success: true });
});

const upload = multer({ storage: multer.diskStorage({ destination: uploadPath, filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) }), limits: { fileSize: 500 * 1024 * 1024 } });

app.post('/api/upload', authenticate, requireRole('manager'), upload.single('file'), (req, res) => {
    const max = db.prepare('SELECT MAX(order_idx) as m FROM videos WHERE course_id = ?').get(req.body.courseId).m || 0;
    db.prepare("INSERT INTO videos (id, course_id, title, filename, path, order_idx) VALUES (?, ?, ?, ?, ?, ?)").run(nanoid(), req.body.courseId, req.body.title, req.file.filename, `/uploads/${req.file.filename}`, max + 1);
    res.json({ success: true });
});

app.post('/api/videos/link', authenticate, requireRole('manager'), (req, res) => {
    const max = db.prepare('SELECT MAX(order_idx) as m FROM videos WHERE course_id = ?').get(req.body.courseId).m || 0;
    db.prepare("INSERT INTO videos (id, course_id, title, filename, path, order_idx) VALUES (?, ?, ?, ?, ?, ?)").run(nanoid(), req.body.courseId, req.body.title, 'YouTube', req.body.url, max + 1);
    res.json({ success: true });
});

app.put('/api/videos/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('UPDATE videos SET title = ? WHERE id = ?').run(req.body.title, req.params.id);
    res.json({ success: true });
});

app.put('/api/videos/reorder', authenticate, requireRole('manager'), (req, res) => {
    const { videoId, direction } = req.body;
    const cur = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    let sib = direction === 'up' 
        ? db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx < ? ORDER BY order_idx DESC LIMIT 1').get(cur.course_id, cur.order_idx)
        : db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx > ? ORDER BY order_idx ASC LIMIT 1').get(cur.course_id, cur.order_idx);
    if(sib) {
        db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(sib.order_idx, cur.id);
        db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(cur.order_idx, sib.id);
    }
    res.json({ success: true });
});

app.delete('/api/videos/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

app.post('/api/subscribe', authenticate, (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'pending' WHERE id = ?").run(req.user.id);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`🚀 Spectre Version 0 Engine Active on ${PORT}`));
