const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Multer configuration for file uploads
const upload = multer({ 
  dest: path.join(__dirname, 'uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson')),
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

    -- 영업자 테이블
    CREATE TABLE IF NOT EXISTS salespersons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employee_code TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      commission_rate REAL DEFAULT 0.0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- DB 관리 테이블 (고객/영업 DB)
    CREATE TABLE IF NOT EXISTS sales_db (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_date DATE,
      proposer TEXT,
      salesperson_id INTEGER,
      meeting_status TEXT,
      company_name TEXT NOT NULL,
      representative TEXT,
      address TEXT,
      contact TEXT,
      industry TEXT,
      sales_amount INTEGER,
      existing_client TEXT,
      contract_status TEXT,
      termination_month TEXT,
      actual_sales INTEGER,
      contract_client TEXT,
      contract_month TEXT,
      client_name TEXT,
      feedback TEXT,
      april_type1_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES salespersons(id)
    );

    -- 계약 관리 테이블
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_type TEXT NOT NULL CHECK(contract_type IN ('sales', 'recruitment')),
      client_name TEXT NOT NULL,
      client_company TEXT,
      salesperson_id INTEGER,
      contract_amount INTEGER DEFAULT 0,
      commission_rate REAL DEFAULT 0.0,
      commission_amount INTEGER DEFAULT 0,
      contract_date DATE,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES salespersons(id)
    );

    -- 수수료 명세서 테이블
    CREATE TABLE IF NOT EXISTS commission_statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salesperson_id INTEGER NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      total_sales INTEGER DEFAULT 0,
      total_commission INTEGER DEFAULT 0,
      payment_date DATE,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES salespersons(id)
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

// ========== DB 관리 API ==========
app.get('/api/sales-db', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT sd.*, s.name as salesperson_name 
      FROM sales_db sd
      LEFT JOIN salespersons s ON sd.salesperson_id = s.id
      ORDER BY sd.proposal_date DESC, sd.created_at DESC
    `;
    
    let salesDB;
    if (search) {
      query = `
        SELECT sd.*, s.name as salesperson_name 
        FROM sales_db sd
        LEFT JOIN salespersons s ON sd.salesperson_id = s.id
        WHERE sd.company_name LIKE ? OR sd.representative LIKE ? OR sd.contact LIKE ? OR sd.client_name LIKE ?
        ORDER BY sd.proposal_date DESC, sd.created_at DESC
      `;
      const searchParam = `%${search}%`;
      salesDB = db.prepare(query).all(searchParam, searchParam, searchParam, searchParam);
    } else {
      salesDB = db.prepare(query).all();
    }
    
    res.json({ success: true, data: salesDB });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/sales-db', (req, res) => {
  try {
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO sales_db (
        proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
        address, contact, industry, sales_amount, existing_client, contract_status,
        termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/sales-db/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET proposal_date = ?, proposer = ?, salesperson_id = ?, meeting_status = ?, 
          company_name = ?, representative = ?, address = ?, contact = ?, industry = ?,
          sales_amount = ?, existing_client = ?, contract_status = ?, termination_month = ?,
          actual_sales = ?, contract_client = ?, contract_month = ?, client_name = ?,
          feedback = ?, april_type1_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date, id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/sales-db/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM sales_db WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// CSV 업로드
app.post('/api/sales-db/upload-csv', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '파일이 없습니다.' });
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      const stmt = db.prepare(`
        INSERT INTO sales_db (
          proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
          address, contact, industry, sales_amount, existing_client, contract_status,
          termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let successCount = 0;
      results.forEach((row, index) => {
        try {
          stmt.run(
            row.proposal_date || row['설의날짜'] || null,
            row.proposer || row['설의자'] || null,
            row.salesperson_id || row['영업자'] || null,
            row.meeting_status || row['미팅여부'] || null,
            row.company_name || row['연차명'] || null,
            row.representative || row['대표자'] || null,
            row.address || row['주소'] || null,
            row.contact || row['연락처'] || null,
            row.industry || row['업종'] || null,
            row.sales_amount || row['매출'] || null,
            row.existing_client || row['기존거래처'] || null,
            row.contract_status || row['계약여부'] || null,
            row.termination_month || row['해임월'] || null,
            row.actual_sales || row['실제매출'] || null,
            row.contract_client || row['계약거래처'] || null,
            row.contract_month || row['계약월'] || null,
            row.client_name || row['거래처'] || null,
            row.feedback || row['기타(피드백)'] || null,
            row.april_type1_date || row['4월1종날짜'] || null
          );
          successCount++;
        } catch (error) {
          errors.push({ row: index + 1, error: error.message });
        }
      });

      // 업로드된 파일 삭제
      fs.unlinkSync(req.file.path);

      res.json({ 
        success: true, 
        message: `${successCount}개 데이터 업로드 완료`,
        total: results.length,
        successCount,
        errors 
      });
    })
    .on('error', (error) => {
      fs.unlinkSync(req.file.path);
      res.json({ success: false, message: error.message });
    });
});

// ========== 직원 관리 API ==========
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT e.*, u.username, u.role, u.name as user_name
      FROM employees e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const { name, username, password, role, employee_code, department, position, hire_date, phone, email } = req.body;
    
    // 먼저 사용자 계정 생성
    const userStmt = db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `);
    const userInfo = userStmt.run(username, password, name, role || 'employee');
    
    // 직원 정보 생성
    const empStmt = db.prepare(`
      INSERT INTO employees (user_id, employee_code, department, position, hire_date, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const empInfo = empStmt.run(userInfo.lastInsertRowid, employee_code, department, position, hire_date, phone, email);
    
    res.json({ success: true, id: empInfo.lastInsertRowid, user_id: userInfo.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, role, employee_code, department, position, hire_date, phone, email } = req.body;
    
    // 직원의 user_id 가져오기
    const employee = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(id);
    
    if (employee && employee.user_id) {
      // 사용자 정보 업데이트
      const userStmt = db.prepare(`
        UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?
      `);
      userStmt.run(username, name, role, employee.user_id);
    }
    
    // 직원 정보 업데이트
    const empStmt = db.prepare(`
      UPDATE employees 
      SET employee_code = ?, department = ?, position = ?, hire_date = ?, phone = ?, email = ?
      WHERE id = ?
    `);
    empStmt.run(employee_code, department, position, hire_date, phone, email, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 직원의 user_id 가져오기
    const employee = db.prepare('SELECT user_id FROM employees WHERE id = ?').get(id);
    
    // 직원 삭제
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    
    // 연결된 사용자도 삭제
    if (employee && employee.user_id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(employee.user_id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 영업자 관리 API ==========
app.get('/api/salespersons', (req, res) => {
  try {
    const salespersons = db.prepare('SELECT * FROM salespersons ORDER BY created_at DESC').all();
    res.json({ success: true, data: salespersons });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/salespersons', (req, res) => {
  try {
    const { name, employee_code, phone, email, commission_rate } = req.body;
    const stmt = db.prepare(`
      INSERT INTO salespersons (name, employee_code, phone, email, commission_rate)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, employee_code, phone, email, commission_rate);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/salespersons/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, employee_code, phone, email, commission_rate, status } = req.body;
    const stmt = db.prepare(`
      UPDATE salespersons 
      SET name = ?, employee_code = ?, phone = ?, email = ?, commission_rate = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(name, employee_code, phone, email, commission_rate, status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/salespersons/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM salespersons WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 계약 관리 API ==========
app.get('/api/contracts', (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT c.*, s.name as salesperson_name 
      FROM contracts c
      LEFT JOIN salespersons s ON c.salesperson_id = s.id
    `;
    
    if (type) {
      query += ` WHERE c.contract_type = ?`;
      const contracts = db.prepare(query + ' ORDER BY c.created_at DESC').all(type);
      res.json({ success: true, data: contracts });
    } else {
      const contracts = db.prepare(query + ' ORDER BY c.created_at DESC').all();
      res.json({ success: true, data: contracts });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/contracts', (req, res) => {
  try {
    const { 
      contract_type, client_name, client_company, salesperson_id, 
      contract_amount, commission_rate, commission_amount, contract_date, notes 
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO contracts (
        contract_type, client_name, client_company, salesperson_id, 
        contract_amount, commission_rate, commission_amount, contract_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      contract_type, client_name, client_company, salesperson_id,
      contract_amount, commission_rate, commission_amount, contract_date, notes
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/contracts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contract_type, client_name, client_company, salesperson_id, 
      contract_amount, commission_rate, commission_amount, contract_date, payment_status, notes 
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE contracts 
      SET contract_type = ?, client_name = ?, client_company = ?, salesperson_id = ?, 
          contract_amount = ?, commission_rate = ?, commission_amount = ?, 
          contract_date = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      contract_type, client_name, client_company, salesperson_id,
      contract_amount, commission_rate, commission_amount, contract_date, payment_status, notes, id
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/contracts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM contracts WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 수수료 명세서 API ==========
app.get('/api/commission-statements', (req, res) => {
  try {
    const { salesperson_id } = req.query;
    let query = `
      SELECT cs.*, s.name as salesperson_name 
      FROM commission_statements cs
      JOIN salespersons s ON cs.salesperson_id = s.id
    `;
    
    if (salesperson_id) {
      query += ` WHERE cs.salesperson_id = ?`;
      const statements = db.prepare(query + ' ORDER BY cs.period_start DESC').all(salesperson_id);
      res.json({ success: true, data: statements });
    } else {
      const statements = db.prepare(query + ' ORDER BY cs.period_start DESC').all();
      res.json({ success: true, data: statements });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/commission-statements', (req, res) => {
  try {
    const { salesperson_id, period_start, period_end, total_sales, total_commission } = req.body;
    const stmt = db.prepare(`
      INSERT INTO commission_statements (salesperson_id, period_start, period_end, total_sales, total_commission)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(salesperson_id, period_start, period_end, total_sales, total_commission);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/commission-statements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { salesperson_id, period_start, period_end, total_sales, total_commission, payment_date, payment_status } = req.body;
    const stmt = db.prepare(`
      UPDATE commission_statements 
      SET salesperson_id = ?, period_start = ?, period_end = ?, 
          total_sales = ?, total_commission = ?, payment_date = ?, payment_status = ?
      WHERE id = ?
    `);
    stmt.run(salesperson_id, period_start, period_end, total_sales, total_commission, payment_date, payment_status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/commission-statements/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM commission_statements WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
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

