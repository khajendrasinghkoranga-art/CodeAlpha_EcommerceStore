const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const router = express.Router();
const DB_PATH = path.join(__dirname, '..', 'data.db');
const db = new sqlite3.Database(DB_PATH);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Ensure OTP table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    code TEXT,
    expiresAt TEXT
  )`);
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateUserId() {
  return 'U-' + Math.floor(100000 + Math.random() * 900000);
}

// POST /api/auth/send-otp { phone }
router.post('/send-otp', (req, res) => {
  const { phone } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const stmt = db.prepare('INSERT INTO otps (phone, code, expiresAt) VALUES (?, ?, ?)');
  stmt.run(phone, code, expiresAt, function (err) {
    stmt.finalize();
    if (err) return res.status(500).json({ error: 'Could not save OTP' });
    // TEST MODE: return the OTP in response (and log it)
    console.log('[TEST-OTP] phone=', phone, 'code=', code);
    res.json({ success: true, phone, code, expiresAt, note: 'TEST MODE - OTP returned in response' });
  });
});

// POST /api/auth/verify-otp { phone, code }
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
  db.get('SELECT * FROM otps WHERE phone = ? AND code = ? ORDER BY id DESC LIMIT 1', [phone, code], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(400).json({ error: 'Invalid code' });
    if (new Date(row.expiresAt) < new Date()) return res.status(400).json({ error: 'Code expired' });

    // Create or find user by phone (email fallback phone@local)
    const emailFallback = `${phone.replace(/[^0-9]/g,'') || phone}@local`;
    db.get('SELECT * FROM users WHERE email = ?', [emailFallback], (err2, userRow) => {
      if (err2) return res.status(500).json({ error: 'DB error' });
      if (userRow) {
        const token = jwt.sign({ id: userRow.id, email: userRow.email, name: userRow.name || '' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, user: { id: userRow.id, email: userRow.email, name: userRow.name || '' } });
      }

      // create user
      const userId = generateUserId();
      const createdAt = new Date().toISOString();
      const stmt = db.prepare('INSERT INTO users (id, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)');
      stmt.run(userId, '', emailFallback, '', createdAt, function (insertErr) {
        stmt.finalize();
        if (insertErr) return res.status(500).json({ error: 'Could not create user' });
        const token = jwt.sign({ id: userId, email: emailFallback, name: '' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, token, user: { id: userId, email: emailFallback, name: '' } });
      });
    });
  });
});

// POST /api/auth/social { provider, email } - TEST-MODE mock social auth
router.post('/social', (req, res) => {
  const { provider, email, name } = req.body || {};
  if (!provider || !email) return res.status(400).json({ error: 'Provider and email required' });
  // In test mode, just create or find user by email
  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) {
      const token = jwt.sign({ id: row.id, email: row.email, name: row.name || '' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, user: { id: row.id, email: row.email, name: row.name || '' } });
    }
    const userId = generateUserId();
    const createdAt = new Date().toISOString();
    const stmt = db.prepare('INSERT INTO users (id, name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)');
    stmt.run(userId, name || '', email.toLowerCase(), '', createdAt, function (insertErr) {
      stmt.finalize();
      if (insertErr) return res.status(500).json({ error: 'Could not create user' });
      const token = jwt.sign({ id: userId, email: email.toLowerCase(), name: name || '' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, user: { id: userId, email: email.toLowerCase(), name: name || '' } });
    });
  });
});

module.exports = router;
