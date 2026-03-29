import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Mukeshmysql1075',
    database: 'digitivity_db'
};

app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ error: "Title is required" });

        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO tasks (title, description) VALUES (?, ?)',
            [title, description]
        );
        await connection.end();
        
        res.status(201).json({ id: result.insertId, title, description, status: 'pending' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM tasks ORDER BY created_at DESC');
        await connection.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        await connection.end();

        if (result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        await connection.end();

        if (result.affectedRows === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});