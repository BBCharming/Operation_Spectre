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
const JWT_SECRET = 'colab-secret';
const JAAS_APP_ID = ""; 

app.use(cors());
app.use(express.json());

const uploadPath = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadPath);
app.use('/uploads', express.static(uploadPath));

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch (err) { res.status(403).json({ error: 'Invalid token' }); }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'manager') return res.status(403).json({ error: 'Forbidden' });
    next();
};

// COMPILER
app.post('/api/compile', authenticate, (req, res) => {
    const { language, code, input } = req.body;
    const tempId = nanoid(5);
    let cmd = '', fileName = '';
    const inputFile = `input_${tempId}.txt`;
    fs.writeFileSync(inputFile, input || '');

    if (language === 'cpp') {
        fileName = `temp_${tempId}.cpp`;
        fs.writeFileSync(fileName, code);
        cmd = `g++ ${fileName} -o temp_${tempId} && ./temp_${tempId} < ${inputFile}`;
    } else if (language === 'java') {
        const match = code.match(/public\s+class\s+(\w+)/);
        const className = match ? match[1] : 'Main';
        fileName = `${className}.java`;
        fs.writeFileSync(fileName, code);
        cmd = `javac ${fileName} && java ${className} < ${inputFile}`;
    }

    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        try { 
            if(fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if(language === 'cpp') { fs.unlinkSync(fileName); fs.unlinkSync(`temp_${tempId}`); }
            if(language === 'java') { fs.unlinkSync(fileName); fs.unlinkSync(fileName.replace('.java', '.class')); }
        } catch(e){}
        res.json({ output: stdout || stderr || error.message });
    });
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if(existing) return res.status(400).json({ error: 'Email exists' });
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(nanoid(), email, hashedPassword, name, 'student');
        const token = jwt.sign({ id: nanoid(), email, role: 'student', name, subscription_status: 'inactive' }, JWT_SECRET);
        res.json({ token, user: { email, name, role: 'student', subscription_status: 'inactive' } });
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'User does not exist' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, subscription_status: user.subscription_status }, JWT_SECRET);
    res.json({ token, user });
});

// MANAGER STATS & USERS
app.get('/api/users', authenticate, requireRole('manager'), (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, subscription_status FROM users WHERE role="student" ORDER BY created_at DESC').all();
    res.json(users);
});

app.get('/api/stats', authenticate, requireRole('manager'), (req, res) => {
    res.json({
        students: db.prepare('SELECT COUNT(*) as count FROM users WHERE role="student"').get().count,
        courses: db.prepare('SELECT COUNT(*) as count FROM courses').get().count,
        videos: db.prepare('SELECT COUNT(*) as count FROM videos').get().count
    });
});

app.post('/api/users/:id/approve', authenticate, requireRole('manager'), (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'active' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

app.post('/api/users/:id/revoke', authenticate, requireRole('manager'), (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
});

app.post('/api/subscribe', authenticate, (req, res) => {
    db.prepare("UPDATE users SET subscription_status = 'pending' WHERE id = ?").run(req.user.id);
    res.json({ success: true });
});

// CONTENT
app.get('/api/courses', (req, res) => {
    const courses = db.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
    res.json(courses.map(c => ({
        ...c, videoCount: db.prepare('SELECT COUNT(*) as cnt FROM videos WHERE course_id = ?').get(c.id).cnt, progress: 0
    })));
});

app.get('/api/courses/:id', authenticate, (req, res) => {
    const c = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({error: 'Not found'});
    
    c.videos = db.prepare('SELECT * FROM videos WHERE course_id = ? ORDER BY order_idx ASC, uploaded_at ASC').all(c.id);
    c.sessions = db.prepare('SELECT * FROM sessions WHERE course_id = ?').all(c.id);
    c.quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ?').all(c.id).map(q => ({
        ...q, questions: db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(q.id)
    }));
    
    const prog = db.prepare('SELECT video_id, percent FROM progress WHERE user_id = ?').all(req.user.id);
    c.progressMap = {}; prog.forEach(p => c.progressMap[p.video_id] = p.percent);
    c.isSubscriber = (req.user.role === 'manager' || req.user.subscription_status === 'active');
    res.json(c);
});

// ACTIONS
app.put('/api/videos/reorder', authenticate, requireRole('manager'), (req, res) => {
    const { videoId, direction } = req.body;
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId);
    if(video) {
        let sibling;
        if (direction === 'up') {
            sibling = db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx < ? ORDER BY order_idx DESC LIMIT 1').get(video.course_id, video.order_idx);
        } else {
            sibling = db.prepare('SELECT * FROM videos WHERE course_id = ? AND order_idx > ? ORDER BY order_idx ASC LIMIT 1').get(video.course_id, video.order_idx);
        }
        if(sibling) {
            db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(sibling.order_idx, video.id);
            db.prepare('UPDATE videos SET order_idx = ? WHERE id = ?').run(video.order_idx, sibling.id);
        }
    }
    res.json({ success: true });
});

app.put('/api/videos/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('UPDATE videos SET title = ? WHERE id = ?').run(req.body.title, req.params.id);
    res.json({ success: true });
});

app.post('/api/progress', authenticate, (req, res) => {
    db.prepare('INSERT INTO progress (user_id, video_id, percent) VALUES (?, ?, ?) ON CONFLICT(user_id, video_id) DO UPDATE SET percent = excluded.percent').run(req.user.id, req.body.videoId, req.body.percent);
    res.json({ success: true });
});

app.put('/api/courses/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('UPDATE courses SET title = ?, description = ? WHERE id = ?').run(req.body.title, req.body.description, req.params.id);
    res.json({ success: true });
});
app.delete('/api/courses/:id', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});
app.post('/api/courses', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('INSERT INTO courses (id, title, description, tutor_name) VALUES (?, ?, ?, ?)').run(nanoid(), req.body.title, req.body.description, req.user.name);
    res.json({ success: true });
});

const storage = multer.diskStorage({ destination: uploadPath, filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) });
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.post('/api/upload', authenticate, requireRole('manager'), upload.single('file'), (req, res) => {
    const webPath = `/uploads/${req.file.filename}`;
    db.prepare('INSERT INTO videos (id, course_id, title, filename, path, order_idx) VALUES (?, ?, ?, ?, ?, ?)').run(nanoid(), req.body.courseId, req.body.title, req.file.filename, webPath, Date.now());
    res.json({ success: true, path: webPath });
});
app.post('/api/videos/link', authenticate, requireRole('manager'), (req, res) => {
    db.prepare('INSERT INTO videos (id, course_id, title, filename, path, order_idx) VALUES (?, ?, ?, ?, ?, ?)').run(nanoid(), req.body.courseId, req.body.title, 'YouTube', req.body.url, Date.now());
    res.json({ success: true });
});
app.post('/api/sessions', authenticate, requireRole('manager'), (req, res) => {
    const roomId = `CharmingTutor-${nanoid(8)}`;
    const joinUrl = `https://meet.jit.si/${roomId}`;
    db.prepare('INSERT INTO sessions (id, course_id, title, room_id, created_by) VALUES (?, ?, ?, ?, ?)').run(nanoid(), req.body.courseId, req.body.title, roomId, req.user.id);
    res.json({ success: true, joinUrl });
});
app.post('/api/quizzes', authenticate, requireRole('manager'), (req, res) => {
    const quizId = nanoid();
    const insert = db.transaction(() => {
        db.prepare('INSERT INTO quizzes (id, course_id, title) VALUES (?, ?, ?)').run(quizId, req.body.courseId, req.body.title);
        const stmt = db.prepare('INSERT INTO questions (id, quiz_id, text, options, correct_idx) VALUES (?, ?, ?, ?, ?)');
        req.body.questions.forEach(q => stmt.run(nanoid(), quizId, q.text, JSON.stringify(q.options), parseInt(q.correct)));
    });
    insert();
    res.json({ success: true });
});
app.delete('/api/sessions/:id', authenticate, requireRole('manager'), (req, res) => { db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id); res.json({ success: true }); });
app.delete('/api/videos/:id', authenticate, requireRole('manager'), (req, res) => { db.prepare('DELETE FROM videos WHERE id = ?').run(req.params.id); res.json({ success: true }); });
app.delete('/api/quizzes/:id', authenticate, requireRole('manager'), (req, res) => { db.transaction(() => { db.prepare('DELETE FROM questions WHERE quiz_id = ?').run(req.params.id); db.prepare('DELETE FROM quizzes WHERE id = ?').run(req.params.id); })(); res.json({ success: true }); });

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
