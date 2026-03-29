import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_super_secret_key_2026';

app.use(express.json());
app.use(cors());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Mukeshmysql1075',
    database: 'digitivity_db'
};

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        await conn.end();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Username already exists or DB error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute('SELECT * FROM users WHERE username = ?', [username]);
    await conn.end();

    if (users.length === 0 || !(await bcrypt.compare(password, users[0].password))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: users[0].id, username: users[0].username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// --- TASK ROUTES ---

// 1. Create Task (with Validation)
app.post('/api/tasks', authenticateToken, [
    body('title').notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { title, description } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        const [result] = await conn.execute(
            'INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)',
            [title, description, req.user.id]
        );
        await conn.end();
        res.status(201).json({ id: result.insertId, title, status: 'pending' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Get All Tasks (with Pagination)
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(
            'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [req.user.id, limit, offset]
        );
        await conn.end();
        res.json({ page: offset / limit + 1, tasks: rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Update Task Status
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const conn = await mysql.createConnection(dbConfig);
        const [result] = await conn.execute(
            'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?',
            [status, req.params.id, req.user.id]
        );
        await conn.end();
        if (result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task updated" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Delete Task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [result] = await conn.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        await conn.end();
        if (result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => console.log(`Secure Server at http://localhost:${PORT}`));