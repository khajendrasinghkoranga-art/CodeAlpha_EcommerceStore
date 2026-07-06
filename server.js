const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname)));

// ═══════════════════════════════════════════════════════
// DATABASE SETUP
// ═══════════════════════════════════════════════════════
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // Orders table (existing)
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    cart TEXT,
    customer TEXT,
    total REAL,
    status TEXT,
    createdAt TEXT,
    paidAt TEXT
  )`);

  // Users table (with admin flag)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    passwordHash TEXT,
    isAdmin INTEGER DEFAULT 0,
    createdAt TEXT
  )`);

  // Add isAdmin column if upgrading from older schema
  db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, (err) => {
    // Ignore error if column already exists
  });

  // Products table (NEW)
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

// ═══════════════════════════════════════════════════════
// SEED PRODUCTS FROM products.js (first run only)
// ═══════════════════════════════════════════════════════
function seedProducts() {
  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error checking products count:', err);
      return;
    }

    if (row.count > 0) {
      console.log(`[DB] Products table already has ${row.count} items — skipping seed.`);
      return;
    }

    // Load products from the static JS file
    let staticProducts = [];
    try {
      staticProducts = require('./js/products.js');
    } catch (e) {
      console.warn('[DB] Could not load products.js for seeding:', e.message);
      return;
    }

    if (!Array.isArray(staticProducts) || staticProducts.length === 0) {
      console.warn('[DB] No products found in products.js');
      return;
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT INTO products (id, name, category, price, originalPrice, image, badge, rating, reviews, description, specs, inStock, featured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    staticProducts.forEach(p => {
      stmt.run(
        p.id,
        p.name,
        p.category,
        p.price,
        p.originalPrice || null,
        p.image || null,
        p.badge || null,
        p.rating || 0,
        p.reviews || 0,
        p.description || '',
        p.specs ? JSON.stringify(p.specs) : null,
        p.inStock !== false ? 1 : 0,
        p.featured ? 1 : 0,
        now,
        now
      );
    });

    stmt.finalize(() => {
      console.log(`[DB] ✅ Seeded ${staticProducts.length} products into the database.`);
    });
  });
}

// Run seed after tables are created
seedProducts();

// ═══════════════════════════════════════════════════════
// AUTH SETUP
// ═══════════════════════════════════════════════════════
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// Default admin credentials (change these!)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'khajendrasinghkoranga@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '7906323254';

function generateUserId() {
  return 'U-' + Math.floor(100000 + Math.random() * 900000);
}

// Seed default admin account
function seedAdmin() {
  db.get('SELECT COUNT(*) as count FROM users WHERE isAdmin = 1', (err, row) => {
    if (err) { console.error('Admin check error:', err); return; }
    if (row && row.count > 0) {
      console.log('[DB] Admin account already exists — skipping seed.');
      return;
    }
    const adminId = 'U-ADMIN-001';
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    db.run(
      'INSERT OR IGNORE INTO users (id, name, email, passwordHash, isAdmin, createdAt) VALUES (?, ?, ?, ?, 1, ?)',
      [adminId, 'Admin', ADMIN_EMAIL, hash, now],
      (err) => {
        if (err) console.error('Admin seed error:', err);
        else console.log(`[DB] ✅ Default admin created — Email: ${ADMIN_EMAIL} | Password: ${ADMIN_PASSWORD}`);
      }
    );
  });
}
seedAdmin();

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Admin-only middleware — checks isAdmin flag in JWT
function authenticateAdmin(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ═══════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════

// Register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  console.log('[AUTH] register attempt:', { email: email });
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const userId = generateUserId();
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare('INSERT INTO users (id, name, email, passwordHash, isAdmin, createdAt) VALUES (?, ?, ?, ?, 0, ?)');
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

// Login (regular users)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log('[AUTH] login attempt:', { email: email });
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

// Admin Login — only allows users with isAdmin=1
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  console.log('[ADMIN] login attempt:', { email: email });
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(401).json({ error: 'Invalid admin credentials' });
    if (!row.isAdmin) return res.status(403).json({ error: 'Access denied. Not an admin account.' });
    const match = bcrypt.compareSync(password, row.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid admin credentials' });
    const token = jwt.sign({ id: row.id, email: row.email, name: row.name || '', isAdmin: true }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ success: true, token, user: { id: row.id, email: row.email, name: row.name || '', isAdmin: true } });
  });
});

// Mount auth router (new file)
try {
  const authRouter = require('./routes/auth');
  app.use('/api/auth', authRouter);
} catch (err) {
  console.warn('Could not mount auth router:', err.message);
}

// Mount OTP/social test auth router
try {
  const otpRouter = require('./routes/otp');
  app.use('/api/auth', otpRouter);
} catch (err) {
  console.warn('Could not mount otp router:', err.message);
}

// ═══════════════════════════════════════════════════════
// PRODUCT API (DB-backed)
// ═══════════════════════════════════════════════════════

// Helper to parse DB row into product object
function parseProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    originalPrice: row.originalPrice || null,
    image: row.image || '',
    badge: row.badge || null,
    rating: row.rating || 0,
    reviews: row.reviews || 0,
    description: row.description || '',
    specs: row.specs ? JSON.parse(row.specs) : {},
    inStock: !!row.inStock,
    featured: !!row.featured
  };
}

// GET all products (public)
app.get('/api/products', (req, res) => {
  const { category, q, sort } = req.query;

  let sql = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }

  if (q) {
    conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  if (sort === 'price-low') sql += ' ORDER BY price ASC';
  else if (sort === 'price-high') sql += ' ORDER BY price DESC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else sql += ' ORDER BY featured DESC, id ASC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Products query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(parseProductRow));
  });
});

// GET single product (public)
app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(parseProductRow(row));
  });
});

// ═══════════════════════════════════════════════════════
// ADMIN API — Products CRUD (auth required)
// ═══════════════════════════════════════════════════════

// Image upload setup with multer
const multer = require('multer');
const uploadDir = path.join(__dirname, 'assets', 'images', 'products');
// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const uniqueName = `${safeName}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// POST upload image
app.post('/api/admin/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const url = `/assets/images/products/${req.file.filename}`;
  res.json({ success: true, url });
});

// GET admin stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    stats.totalProducts = row ? row.count : 0;

    db.get('SELECT COUNT(*) as count FROM users', (err2, row2) => {
      stats.totalUsers = row2 ? row2.count : 0;

      db.get('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue FROM orders', (err3, row3) => {
        stats.totalOrders = row3 ? row3.count : 0;
        stats.totalRevenue = row3 ? row3.revenue : 0;

        res.json(stats);
      });
    });
  });
});

// POST create product
app.post('/api/admin/products', authenticateAdmin, (req, res) => {
  const { id, name, category, price, originalPrice, image, badge, rating, reviews, description, specs, inStock, featured } = req.body || {};

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const productId = id || ('p' + Date.now());
  const now = new Date().toISOString();

  const stmt = db.prepare(`INSERT INTO products (id, name, category, price, originalPrice, image, badge, rating, reviews, description, specs, inStock, featured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  stmt.run(
    productId,
    name,
    category,
    price,
    originalPrice || null,
    image || null,
    badge || null,
    rating || 0,
    reviews || 0,
    description || '',
    specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : null,
    inStock !== false ? 1 : 0,
    featured ? 1 : 0,
    now,
    now,
    function (err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Product ID already exists' });
        }
        console.error('Product insert error:', err);
        return res.status(500).json({ error: 'Could not create product' });
      }
      res.json({ success: true, id: productId });
    }
  );
  stmt.finalize();
});

// PUT update product
app.put('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, category, price, originalPrice, image, badge, rating, reviews, description, specs, inStock, featured } = req.body || {};

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const now = new Date().toISOString();

  db.run(
    `UPDATE products SET name=?, category=?, price=?, originalPrice=?, image=?, badge=?, rating=?, reviews=?, description=?, specs=?, inStock=?, featured=?, updatedAt=? WHERE id=?`,
    [
      name,
      category,
      price,
      originalPrice || null,
      image || null,
      badge || null,
      rating || 0,
      reviews || 0,
      description || '',
      specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : null,
      inStock !== false ? 1 : 0,
      featured ? 1 : 0,
      now,
      productId
    ],
    function (err) {
      if (err) {
        console.error('Product update error:', err);
        return res.status(500).json({ error: 'Could not update product' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true, id: productId });
    }
  );
});

// DELETE product
app.delete('/api/admin/products/:id', authenticateAdmin, (req, res) => {
  const productId = req.params.id;

  db.run('DELETE FROM products WHERE id = ?', [productId], function (err) {
    if (err) {
      console.error('Product delete error:', err);
      return res.status(500).json({ error: 'Could not delete product' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, id: productId });
  });
});

// ═══════════════════════════════════════════════════════
// ORDER ROUTES (existing)
// ═══════════════════════════════════════════════════════

app.post('/api/checkout', authenticateToken, (req, res) => {
  const { cart, customer } = req.body || {};
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const orderId = 'N-' + Math.floor(100000 + Math.random() * 900000);
  const total = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const createdAt = new Date().toISOString();

  // Use authenticated user as customer if not provided
  const cust = customer && Object.keys(customer).length ? customer : { id: req.user.id, email: req.user.email, name: req.user.name };

  const stmt = db.prepare(`INSERT INTO orders (id, cart, customer, total, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)`);
  stmt.run(orderId, JSON.stringify(cart), JSON.stringify(cust || {}), total, 'pending', createdAt, function (err) {
    if (err) {
      console.error('DB insert error', err);
      return res.status(500).json({ error: 'Could not create order' });
    }

    res.json({ success: true, orderId });
  });
  stmt.finalize();
});

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const parsed = rows.map(r => ({
      id: r.id,
      cart: JSON.parse(r.cart || '[]'),
      customer: JSON.parse(r.customer || '{}'),
      total: r.total,
      status: r.status,
      createdAt: r.createdAt,
      paidAt: r.paidAt
    }));
    res.json(parsed);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Order not found' });
    res.json({
      id: row.id,
      cart: JSON.parse(row.cart || '[]'),
      customer: JSON.parse(row.customer || '{}'),
      total: row.total,
      status: row.status,
      createdAt: row.createdAt,
      paidAt: row.paidAt
    });
  });
});

// Simulate payment for an order (demo)
app.post('/api/pay/:id', (req, res) => {
  const orderId = req.params.id;
  const paidAt = new Date().toISOString();
  db.run('UPDATE orders SET status = ?, paidAt = ? WHERE id = ?', ['paid', paidAt, orderId], function (err) {
    if (err) return res.status(500).json({ error: 'Payment failed' });
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err2, row) => {
      if (err2 || !row) return res.status(500).json({ error: 'Order not found after payment' });
      res.json({ success: true, orderId: row.id, paidAt: row.paidAt });
    });
  });
});

// Simple invoice HTML
app.get('/invoice/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Invoice not found');
    const order = {
      id: row.id,
      cart: JSON.parse(row.cart || '[]'),
      customer: JSON.parse(row.customer || '{}'),
      total: row.total,
      status: row.status,
      createdAt: row.createdAt,
      paidAt: row.paidAt
    };

    const itemsHtml = order.cart.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>$${i.price.toFixed(2)}</td><td>$${(i.price * i.qty).toFixed(2)}</td></tr>`).join('');

    res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${order.id}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px}</style></head><body><h1>Invoice ${order.id}</h1><p><strong>Status:</strong> ${order.status}</p><p><strong>Customer:</strong> ${order.customer.name || order.customer.email || ''}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table><h3>Total: $${order.total.toFixed(2)}</h3><p>Created: ${order.createdAt}</p></body></html>`);
  });
});

// ═══════════════════════════════════════════════════════
// PAGE ROUTES
// ═══════════════════════════════════════════════════════

// Serve standalone login page at /login for convenience
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve standalone profile page at /profile
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

// Serve admin dashboard at /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback: serve index.html for SPA routes
// Fallback handler for SPA routes — use app.use to avoid path-to-regexp errors in some Express versions
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
});
