const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Database initialization
let db;

function initDatabase() {
  const dbPath = path.join(__dirname, 'erp.db');
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    -- Users table (관리자 및 직원)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table (제품)
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      consumer_price INTEGER DEFAULT 0,
      purchase_price INTEGER DEFAULT 0,
      month TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employees table (직원 정보)
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      employee_code TEXT UNIQUE NOT NULL,
      department TEXT,
      position TEXT,
      hire_date DATE,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Attendance table (근태)
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in TIME,
      check_out TIME,
      status TEXT CHECK(status IN ('present', 'absent', 'late', 'early_leave')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    -- Leave table (휴가)
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // Insert default admin user if not exists
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').run(
      'admin',
      'admin123', // In production, this should be hashed
      '관리자',
      'admin'
    );
  }

  console.log('Database initialized at:', dbPath);
}

initDatabase();

// API Routes

// Auth
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, username, name, role FROM users WHERE username = ? AND password = ?').get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Products
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    res.json({ success: true, data: products });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    const stmt = db.prepare(`
      INSERT INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      product.barcode,
      product.product_name,
      product.quantity,
      product.consumer_price,
      product.purchase_price,
      product.month
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    const stmt = db.prepare(`
      UPDATE products 
      SET barcode = ?, product_name = ?, quantity = ?, consumer_price = ?, purchase_price = ?, month = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      product.barcode,
      product.product_name,
      product.quantity,
      product.consumer_price,
      product.purchase_price,
      product.month,
      id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products/import', (req, res) => {
  try {
    const products = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((products) => {
      for (const product of products) {
        stmt.run(
          product.barcode,
          product.product_name,
          product.quantity,
          product.consumer_price,
          product.purchase_price,
          product.month
        );
      }
    });

    insertMany(products);
    res.json({ success: true, count: products.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/products/import-csv', (req, res) => {
  try {
    // Look for products_import.csv in the parent directory
    const csvPath = path.join(__dirname, '../../products_import.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.json({ success: false, message: 'CSV 파일을 찾을 수 없습니다.' });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (barcode, product_name, quantity, consumer_price, purchase_price, month)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    const insertMany = db.transaction(() => {
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse CSV line (handle commas in quotes)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        if (values.length >= 6) {
          const [month, barcode, product_name, quantity, consumer_price, purchase_price] = values;
          stmt.run(
            barcode,
            product_name,
            parseInt(quantity) || 0,
            parseInt(consumer_price) || 0,
            parseInt(purchase_price) || 0,
            month
          );
          count++;
        }
      }
    });

    insertMany();
    res.json({ success: true, count });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Employees
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*, u.username, u.name as user_name 
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Attendance
app.get('/api/attendance', (req, res) => {
  try {
    const attendance = db.prepare(`
      SELECT a.*, e.employee_code, u.name as employee_name
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY a.date DESC, a.created_at DESC
    `).all();
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Leaves
app.get('/api/leaves', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.employee_code, u.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY l.created_at DESC
    `).all();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`ERP Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (db) db.close();
  process.exit();
});

process.on('SIGTERM', () => {
  if (db) db.close();
  process.exit();
});

