const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      passwordHash TEXT,
      isAdmin INTEGER DEFAULT 0,
      createdAt TEXT
    )`);

    db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      cart TEXT,
      customer TEXT,
      total REAL,
      status TEXT,
      createdAt TEXT,
      paidAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      originalPrice REAL,
      image TEXT,
      badge TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      description TEXT,
      specs TEXT,
      inStock INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )`);
  });
}

function createUser({ id, name, email, passwordHash, isAdmin = 0, createdAt }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (id, name, email, passwordHash, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name || '', email.toLowerCase(), passwordHash, isAdmin ? 1 : 0, createdAt],
      function (err) {
        if (err) return reject(err);
        resolve({ id, name: name || '', email: email.toLowerCase(), isAdmin: !!isAdmin, createdAt });
      }
    );
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = {
  db,
  DB_PATH,
  initializeDatabase,
  createUser,
  getUserByEmail
};
