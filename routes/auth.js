const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Config
const DB_PATH = path.join(__dirname, '..', 'data.db');
const db = new sqlite3.Database(DB_PATH);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Ensure users table exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    passwordHash TEXT,
    createdAt TEXT
  )`);
});

function generateUserId() {
  return 'U-' + Math.floor(100000 + Math.random() * 900000);
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  console.log('[AUTH] /api/auth/register attempt:', { email: email });
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const userId = generateUserId();
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare('INSERT INTO users (id, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)');
  stmt.run(userId, name || '', email.toLowerCase(), passwordHash, createdAt, function (err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
      console.error('User insert error', err);
      return res.status(500).json({ error: 'Could not create user' });
    }
    const token = jwt.sign({ id: userId, email: email.toLowerCase(), name: name || '' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: userId, email: email.toLowerCase(), name: name || '' } });
  });
  stmt.finalize();
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log('[AUTH] /api/auth/login attempt:', { email: email });
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(400).json({ error: 'Invalid email or password' });
    const match = bcrypt.compareSync(password, row.passwordHash);
    if (!match) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: row.id, email: row.email, name: row.name || '' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: row.id, email: row.email, name: row.name || '' } });
  });
});

module.exports = router;
