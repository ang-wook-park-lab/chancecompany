// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const multer = require('multer');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 104857600; // 100MB default
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/app/data' : __dirname;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads/');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 대량 JSON 데이터 지원
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../dist')));

// Multer configuration for file uploads (대량 업로드 지원)
const upload = multer({ 
  dest: UPLOAD_DIR,
  limits: { 
    fileSize: MAX_FILE_SIZE, // 100MB
    fieldSize: 50 * 1024 * 1024 // 50MB for form fields
  }
});

// Database initialization
let db;

function initDatabase() {
  // Use /app/data for Railway Volume, fallback to local path
  const dataDir = process.env.NODE_ENV === 'production' 
    ? '/app/data' 
    : __dirname;
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'erp.db');
  console.log(`Database path: ${dbPath}`);
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    -- Users table (관리자 및 직원)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'employee', 'salesperson', 'recruiter')),
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

    -- 영업자 테이블 (더 이상 사용하지 않음 - users 테이블 사용)
    -- CREATE TABLE IF NOT EXISTS salespersons (
    --   id INTEGER PRIMARY KEY AUTOINCREMENT,
    --   name TEXT NOT NULL,
    --   employee_code TEXT UNIQUE,
    --   phone TEXT,
    --   email TEXT,
    --   commission_rate REAL DEFAULT 0.0,
    --   status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    --   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    -- );

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
      april_type1_date TEXT,
      commission_rate REAL DEFAULT 500,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
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
      FOREIGN KEY (salesperson_id) REFERENCES users(id)
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

    -- 일정 관리 테이블 (영업자/관리자)
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      schedule_date DATE NOT NULL,
      schedule_time TIME,
      client_name TEXT,
      location TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 메모 테이블 (영업자/관리자)
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 해피콜 관리 테이블
    CREATE TABLE IF NOT EXISTS happy_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      phone TEXT,
      satisfaction_level TEXT CHECK(satisfaction_level IN ('상', '중', '하')),
      content TEXT,
      handler TEXT,
      call_date DATE,
      salesperson_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 경정청구 검토 테이블
    CREATE TABLE IF NOT EXISTS correction_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      representative TEXT,
      handler TEXT,
      is_first_startup BOOLEAN DEFAULT 0,
      status TEXT DEFAULT '대기' CHECK(status IN ('대기', '환급가능', '환급불가', '자료수집X')),
      progress_status TEXT,
      refund_amount INTEGER DEFAULT 0,
      document_delivery DATE,
      feedback TEXT,
      sales_db_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sales_db_id) REFERENCES sales_db(id)
    );

    -- 매출거래처 관리 테이블
    CREATE TABLE IF NOT EXISTS sales_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_code TEXT UNIQUE,
      representative TEXT,
      contact TEXT,
      address TEXT,
      business_type TEXT,
      commission_rate REAL DEFAULT 0.0,
      notes TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 공지사항 테이블
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      is_important BOOLEAN DEFAULT 0,
      is_pinned BOOLEAN DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- 계정 변경 요청 테이블
    CREATE TABLE IF NOT EXISTS account_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      request_type TEXT NOT NULL CHECK(request_type IN ('password', 'info', 'role')),
      current_value TEXT,
      new_value TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
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

  // 기존 sales_db 테이블에 commission_rate 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE sales_db ADD COLUMN commission_rate REAL DEFAULT 500');
    console.log('commission_rate 필드가 sales_db 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 에러 발생, 무시
    if (!e.message.includes('duplicate column')) {
      console.error('commission_rate 필드 추가 중 오류:', e.message);
    }
  }

  // 기존 sales_db 테이블에 contract_date 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE sales_db ADD COLUMN contract_date DATE');
    console.log('contract_date 필드가 sales_db 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 에러 발생, 무시
  }

  // 기존 attendance 테이블에 위치 정보 필드 추가 (없으면)
  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_in_location TEXT');
    console.log('check_in_location 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_out_location TEXT');
    console.log('check_out_location 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_in_coordinates TEXT');
    console.log('check_in_coordinates 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  try {
    db.exec('ALTER TABLE attendance ADD COLUMN check_out_coordinates TEXT');
    console.log('check_out_coordinates 필드가 attendance 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
    if (!e.message.includes('duplicate column')) {
      console.error('contract_date 필드 추가 중 오류:', e.message);
    }
  }

  // happy_calls 테이블에 sales_db_id 필드 추가 (연계용)
  try {
    db.exec('ALTER TABLE happy_calls ADD COLUMN sales_db_id INTEGER');
    console.log('sales_db_id 필드가 happy_calls 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }

  // sales_db 테이블에 sales_client_id 필드 추가 (매출거래처 연계)
  try {
    db.exec('ALTER TABLE sales_db ADD COLUMN sales_client_id INTEGER');
    console.log('sales_client_id 필드가 sales_db 테이블에 추가되었습니다.');
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
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

// Users API
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json({ success: true, data: users });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Employees API
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.prepare(`
      SELECT 
        e.id,
        e.employee_code,
        e.department,
        e.position,
        e.hire_date,
        e.phone,
        e.email,
        u.name,
        u.username,
        u.role
      FROM employees e
      INNER JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, password, name, role, employee_code, department, position } = req.body;
    
    // 사용자 계정 생성
    const userStmt = db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `);
    const userInfo = userStmt.run(username, password, name, role);
    
    // 직원 정보도 함께 생성
    const employeeStmt = db.prepare(`
      INSERT INTO employees (user_id, employee_code, department, position, hire_date)
      VALUES (?, ?, ?, ?, DATE('now'))
    `);
    employeeStmt.run(
      userInfo.lastInsertRowid,
      employee_code || `EMP${String(userInfo.lastInsertRowid).padStart(3, '0')}`, 
      department || '부서 미정', 
      position || '직급 미정'
    );
    
    res.json({ success: true, id: userInfo.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, role } = req.body;
    
    // 비밀번호가 제공된 경우에만 업데이트
    if (password) {
      const stmt = db.prepare(`
        UPDATE users 
        SET username = ?, password = ?, name = ?, role = ?
        WHERE id = ?
      `);
      stmt.run(username, password, name, role, id);
    } else {
      const stmt = db.prepare(`
        UPDATE users 
        SET username = ?, name = ?, role = ?
        WHERE id = ?
      `);
      stmt.run(username, name, role, id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
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

// 출근 기록 (위치 정보 포함)
app.post('/api/attendance/clock-in', (req, res) => {
  try {
    let { employee_id, date, check_in, check_in_location, check_in_coordinates } = req.body;
    
    // employee_id가 실제로 user_id인 경우 employees 테이블에서 employee_id를 찾음
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(employee_id);
    if (employee) {
      employee_id = employee.id;
    }
    
    // 기존 기록이 있는지 확인
    const existing = db.prepare('SELECT id FROM attendance WHERE employee_id = ? AND date = ?')
      .get(employee_id, date);
    
    if (existing) {
      // 업데이트
      db.prepare(`
        UPDATE attendance 
        SET check_in = ?, check_in_location = ?, check_in_coordinates = ?, status = 'present'
        WHERE id = ?
      `).run(check_in, check_in_location, check_in_coordinates, existing.id);
      
      res.json({ success: true, id: existing.id, updated: true });
    } else {
      // 삽입
      const result = db.prepare(`
        INSERT INTO attendance (employee_id, date, check_in, check_in_location, check_in_coordinates, status)
        VALUES (?, ?, ?, ?, ?, 'present')
      `).run(employee_id, date, check_in, check_in_location, check_in_coordinates);
      
      res.json({ success: true, id: result.lastInsertRowid, updated: false });
    }
  } catch (error) {
    console.error('출근 기록 저장 실패:', error);
    res.json({ success: false, message: error.message });
  }
});

// 퇴근 기록 (위치 정보 포함)
app.post('/api/attendance/clock-out', (req, res) => {
  try {
    let { employee_id, date, check_out, check_out_location, check_out_coordinates } = req.body;
    
    // employee_id가 실제로 user_id인 경우 employees 테이블에서 employee_id를 찾음
    const employee = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(employee_id);
    if (employee) {
      employee_id = employee.id;
    }
    
    // 기존 출근 기록 업데이트
    const result = db.prepare(`
      UPDATE attendance 
      SET check_out = ?, check_out_location = ?, check_out_coordinates = ?
      WHERE employee_id = ? AND date = ?
    `).run(check_out, check_out_location, check_out_coordinates, employee_id, date);
    
    if (result.changes > 0) {
      res.json({ success: true, updated: true });
    } else {
      // 출근 기록이 없으면 새로 생성
      const insertResult = db.prepare(`
        INSERT INTO attendance (employee_id, date, check_out, check_out_location, check_out_coordinates, status)
        VALUES (?, ?, ?, ?, ?, 'present')
      `).run(employee_id, date, check_out, check_out_location, check_out_coordinates);
      
      res.json({ success: true, id: insertResult.lastInsertRowid, updated: false });
    }
  } catch (error) {
    console.error('퇴근 기록 저장 실패:', error);
    res.json({ success: false, message: error.message });
  }
});

// Leaves
// 승인된 휴가만 조회 (캘린더용)
app.get('/api/leaves', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.employee_code, e.user_id, u.name as employee_name
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE l.status = 'approved'
      ORDER BY l.created_at DESC
    `).all();
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 모든 휴가 조회 (관리 페이지용)
app.get('/api/leaves/all', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.employee_code, e.user_id, u.name as employee_name
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

// 휴가 상태 업데이트
app.put('/api/leaves/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    db.prepare(`
      UPDATE leaves 
      SET status = ?
      WHERE id = ?
    `).run(status, id);
    
    res.json({ success: true, message: '휴가 상태가 업데이트되었습니다.' });
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

// 모든 sales_db 데이터 조회 (DB등록 페이지용)
app.get('/api/sales-db/all', (req, res) => {
  try {
    const allData = db.prepare(`
      SELECT * FROM sales_db 
      ORDER BY created_at DESC
    `).all();
    res.json({ success: true, data: allData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/sales-db', (req, res) => {
  try {
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO sales_db (
        proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
        address, contact, industry, sales_amount, existing_client, contract_status,
        termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date
    );
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.put('/api/sales-db/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    // commission_rate만 업데이트하는 경우 (수수료 명세서에서 호출)
    if (Object.keys(body).length === 1 && body.commission_rate !== undefined) {
      const stmt = db.prepare(`
        UPDATE sales_db 
        SET commission_rate = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(body.commission_rate, id);
      res.json({ success: true });
      return;
    }
    
    // 전체 업데이트 (DB등록에서 호출)
    const { 
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date, commission_rate
    } = body;
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET proposal_date = ?, proposer = ?, salesperson_id = ?, meeting_status = ?, 
          company_name = ?, representative = ?, address = ?, contact = ?, industry = ?,
          sales_amount = ?, existing_client = ?, contract_status = ?, termination_month = ?,
          actual_sales = ?, contract_date = ?, contract_client = ?, contract_month = ?, client_name = ?,
          feedback = ?, april_type1_date = ?, commission_rate = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
      address, contact, industry, sales_amount, existing_client, contract_status,
      termination_month, actual_sales, contract_date, contract_client, contract_month, client_name, feedback, april_type1_date, commission_rate || 500, id
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

// 대량 CSV 업로드 (스트리밍 처리 - 수만 개 이상의 행에 최적화)
app.post('/api/sales-db/upload-csv-stream', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '파일이 없습니다.' });
  }

  const errors = [];
  let processedCount = 0;
  const BATCH_SIZE = 500; // 500개씩 배치 처리
  let batch = [];
  let isPaused = false;

  const processBatch = (rows) => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO sales_db (
            proposal_date, proposer, salesperson_id, meeting_status, company_name, representative,
            address, contact, industry, sales_amount, existing_client, contract_status,
            termination_month, actual_sales, contract_client, contract_month, client_name, feedback, april_type1_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = db.transaction((rows) => {
          for (const row of rows) {
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
            } catch (err) {
              errors.push({ row: processedCount + rows.indexOf(row) + 1, error: err.message });
            }
          }
        });

        insertMany(rows);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  };

  const stream = fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', async (row) => {
      batch.push(row);
      
      if (batch.length >= BATCH_SIZE && !isPaused) {
        isPaused = true;
        stream.pause();
        
        const currentBatch = batch.splice(0, BATCH_SIZE);
        
        try {
          await processBatch(currentBatch);
          processedCount += currentBatch.length;
          console.log(`Processed ${processedCount} rows...`);
        } catch (err) {
          errors.push({ batch: Math.floor(processedCount / BATCH_SIZE), error: err.message });
        }
        
        isPaused = false;
        stream.resume();
      }
    })
    .on('end', async () => {
      // 남은 데이터 처리
      if (batch.length > 0) {
        try {
          await processBatch(batch);
          processedCount += batch.length;
        } catch (err) {
          errors.push({ batch: 'final', error: err.message });
        }
      }
      
      // 임시 파일 삭제
      fs.unlinkSync(req.file.path);
      
      res.json({ 
        success: true, 
        message: `${processedCount}개 항목 처리 완료`,
        processedCount,
        errors: errors.length > 0 ? errors : undefined,
        errorCount: errors.length
      });
    })
    .on('error', (err) => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.json({ success: false, message: err.message });
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
    const salespersons = db.prepare(`
      SELECT id, name 
      FROM users 
      WHERE role = 'salesperson' 
      ORDER BY created_at DESC
    `).all();
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

// 영업자별 수수료 상세 조회 (계약여부='Y'인 데이터만)
app.get('/api/salesperson/:id/commission-details', (req, res) => {
  try {
    const { id } = req.params;
    
    const details = db.prepare(`
      SELECT 
        id,
        company_name,
        contract_client,
        contract_date,
        COALESCE(commission_rate, 500) as commission_rate,
        CAST(REPLACE(contract_client, ',', '') AS INTEGER) as commission_base,
        CAST((CAST(REPLACE(contract_client, ',', '') AS INTEGER) * COALESCE(commission_rate, 500) / 100) AS INTEGER) as commission_amount,
        contract_status
      FROM sales_db 
      WHERE salesperson_id = ? AND contract_status IN ('Y', '해임')
      ORDER BY contract_date DESC, created_at DESC
    `).all(id);
    
    res.json({ success: true, data: details });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 영업자 본인 데이터만 조회
app.get('/api/sales-db/my-data', (req, res) => {
  try {
    const { salesperson_id } = req.query;
    
    if (!salesperson_id) {
      return res.json({ success: false, message: '영업자 ID가 필요합니다.' });
    }
    
    const myData = db.prepare(`
      SELECT * FROM sales_db 
      WHERE salesperson_id = ? 
      ORDER BY created_at DESC
    `).all(salesperson_id);
    
    res.json({ success: true, data: myData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 영업자가 특정 필드만 수정
app.put('/api/sales-db/:id/salesperson-update', (req, res) => {
  try {
    const { id } = req.params;
    const { contract_date, meeting_status, contract_client, client_name, feedback, salesperson_id } = req.body;
    
    // 본인 데이터인지 확인
    const record = db.prepare('SELECT salesperson_id FROM sales_db WHERE id = ?').get(id);
    if (!record || record.salesperson_id != salesperson_id) {
      return res.json({ success: false, message: '권한이 없습니다.' });
    }
    
    const stmt = db.prepare(`
      UPDATE sales_db 
      SET contract_date = ?, meeting_status = ?, contract_client = ?, client_name = ?, feedback = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(contract_date, meeting_status, contract_client, client_name, feedback, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 계약 관리 API ==========
app.get('/api/contracts', (req, res) => {
  try {
    const { type, salesperson_id } = req.query;
    let query = `
      SELECT c.*, s.name as salesperson_name 
      FROM contracts c
      LEFT JOIN salespersons s ON c.salesperson_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    // 계약 유형 필터링
    if (type) {
      conditions.push('c.contract_type = ?');
      params.push(type);
    }
    
    // 영업자 필터링 (영업자가 본인 계약만 보기)
    if (salesperson_id) {
      conditions.push('c.salesperson_id = ?');
      params.push(salesperson_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const contracts = db.prepare(query + ' ORDER BY c.created_at DESC').all(...params);
    res.json({ success: true, data: contracts });
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

// ========== 일정 관리 API (Schedules) ==========
// 일정 조회 (본인 것만 조회, 관리자는 모든 일정 조회 가능)
app.get('/api/schedules', (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT s.*, u.name as user_name 
      FROM schedules s
      LEFT JOIN users u ON s.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ` WHERE s.user_id = ?`;
      params.push(user_id);
    }
    
    query += ` ORDER BY s.schedule_date DESC, s.schedule_time DESC`;
    
    const schedules = db.prepare(query).all(...params);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 추가
app.post('/api/schedules', (req, res) => {
  try {
    const { user_id, title, schedule_date, schedule_time, client_name, location, notes, status } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO schedules (user_id, title, schedule_date, schedule_time, client_name, location, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, title, schedule_date, schedule_time, client_name, location, notes, status || 'scheduled');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 수정
app.put('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, schedule_date, schedule_time, client_name, location, notes, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE schedules 
      SET title = ?, schedule_date = ?, schedule_time = ?, 
          client_name = ?, location = ?, notes = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(title, schedule_date, schedule_time, client_name, location, notes, status, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 일정 삭제
app.delete('/api/schedules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ========== 메모 API (Memos) ==========
// 메모 조회 (본인 것만 조회, 관리자는 모든 메모 조회 가능)
app.get('/api/memos', (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = `
      SELECT m.*, u.name as user_name 
      FROM memos m
      LEFT JOIN users u ON m.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ` WHERE m.user_id = ?`;
      params.push(user_id);
    }
    
    query += ` ORDER BY m.created_at DESC`;
    
    const memos = db.prepare(query).all(...params);
    res.json({ success: true, data: memos });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 추가
app.post('/api/memos', (req, res) => {
  try {
    const { user_id, title, content, category } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO memos (user_id, title, content, category)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, title, content, category);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 수정
app.put('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    
    const stmt = db.prepare(`
      UPDATE memos 
      SET title = ?, content = ?, category = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(title, content, category, id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 메모 삭제
app.delete('/api/memos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM memos WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 해피콜 관리 API
// ============================================

// 해피콜 목록 조회
app.get('/api/happy-calls', (req, res) => {
  try {
    const { satisfaction_level, search } = req.query;
    let query = 'SELECT * FROM happy_calls WHERE 1=1';
    const params = [];

    if (satisfaction_level && satisfaction_level !== '전체') {
      query += ' AND satisfaction_level = ?';
      params.push(satisfaction_level);
    }

    if (search) {
      query += ' AND (client_name LIKE ? OR salesperson_name LIKE ? OR handler LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const happyCalls = stmt.all(...params);

    res.json({ success: true, data: happyCalls });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 등록
app.post('/api/happy-calls', (req, res) => {
  try {
    const { client_name, phone, satisfaction_level, content, handler, salesperson_name, call_date } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO happy_calls 
      (client_name, phone, satisfaction_level, content, handler, salesperson_name, call_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(client_name, phone, satisfaction_level, content, handler, salesperson_name, call_date);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 수정
app.put('/api/happy-calls/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, phone, satisfaction_level, content, handler, salesperson_name, call_date } = req.body;
    
    const stmt = db.prepare(`
      UPDATE happy_calls 
      SET client_name = ?, phone = ?, satisfaction_level = ?, content = ?, 
          handler = ?, salesperson_name = ?, call_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(client_name, phone, satisfaction_level, content, handler, salesperson_name, call_date, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 삭제
app.delete('/api/happy-calls/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM happy_calls WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 해피콜 통계
app.get('/api/happy-calls/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM happy_calls').get();
    const sang = db.prepare('SELECT COUNT(*) as count FROM happy_calls WHERE satisfaction_level = ?').get('상');
    const jung = db.prepare('SELECT COUNT(*) as count FROM happy_calls WHERE satisfaction_level = ?').get('중');
    const ha = db.prepare('SELECT COUNT(*) as count FROM happy_calls WHERE satisfaction_level = ?').get('하');

    res.json({
      success: true,
      stats: {
        total: total.count,
        상: sang.count,
        중: jung.count,
        하: ha.count
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 경정청구 검토 API
// ============================================

// 경정청구 목록 조회
app.get('/api/correction-requests', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM correction_requests WHERE 1=1';
    const params = [];

    if (status && status !== '전체') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (company_name LIKE ? OR representative LIKE ? OR handler LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const requests = stmt.all(...params);

    res.json({ success: true, data: requests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 경정청구 등록
app.post('/api/correction-requests', (req, res) => {
  try {
    const { 
      company_name, representative, handler, is_first_startup, 
      status, progress_status, refund_amount, document_delivery, feedback 
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO correction_requests 
      (company_name, representative, handler, is_first_startup, status, 
       progress_status, refund_amount, document_delivery, feedback) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      company_name, representative, handler, is_first_startup ? 1 : 0, 
      status || '대기', progress_status, refund_amount || 0, 
      document_delivery, feedback
    );
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 경정청구 수정
app.put('/api/correction-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { 
      company_name, representative, handler, is_first_startup, 
      status, progress_status, refund_amount, document_delivery, feedback 
    } = req.body;
    
    const stmt = db.prepare(`
      UPDATE correction_requests 
      SET company_name = ?, representative = ?, handler = ?, is_first_startup = ?, 
          status = ?, progress_status = ?, refund_amount = ?, document_delivery = ?, 
          feedback = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      company_name, representative, handler, is_first_startup ? 1 : 0, 
      status, progress_status, refund_amount, document_delivery, feedback, id
    );
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 경정청구 삭제
app.delete('/api/correction-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM correction_requests WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 경정청구 통계
app.get('/api/correction-requests/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM correction_requests').get();
    const possible = db.prepare('SELECT COUNT(*) as count FROM correction_requests WHERE status = ?').get('환급가능');
    const impossible = db.prepare('SELECT COUNT(*) as count FROM correction_requests WHERE status = ?').get('환급불가');
    const totalRefund = db.prepare('SELECT SUM(refund_amount) as total FROM correction_requests WHERE status = ?').get('환급가능');

    res.json({
      success: true,
      stats: {
        total: total.count,
        possible: possible.count,
        impossible: impossible.count,
        totalRefund: totalRefund.total || 0
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 월별 실적 현황 API
// ============================================

// 월별 실적 조회
app.get('/api/monthly-performance', (req, res) => {
  try {
    const { year, month, contract_status, client } = req.query;
    
    let query = `
      SELECT 
        sd.*,
        u.name as salesperson_name
      FROM sales_db sd
      LEFT JOIN users u ON sd.salesperson_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (year && month) {
      query += ` AND strftime('%Y', sd.proposal_date) = ? AND strftime('%m', sd.proposal_date) = ?`;
      params.push(year, month.padStart(2, '0'));
    }

    if (contract_status && contract_status !== '전체') {
      query += ` AND sd.contract_status = ?`;
      params.push(contract_status);
    }

    if (client && client !== '전체') {
      query += ` AND sd.contract_client = ?`;
      params.push(client);
    }

    query += ' ORDER BY sd.proposal_date DESC';

    const stmt = db.prepare(query);
    const data = stmt.all(...params);

    // 통계 계산
    const stats = {
      total: data.length,
      contracted: data.filter(d => d.contract_status === '계약완료').length,
      notContracted: data.filter(d => d.contract_status === '미계약').length,
      meetingCompleted: data.filter(d => d.meeting_status === '미팅완료').length,
      totalAmount: data.reduce((sum, d) => sum + (d.actual_sales || 0), 0),
      correctionCount: 0, // 경정청구와 연계 필요
      correctionRefund: 0
    };

    res.json({ success: true, data, stats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 영업자 개인별 실적 API
// ============================================

// 영업자 개인별 실적 조회
app.get('/api/salesperson-performance', (req, res) => {
  try {
    const { year, month, mode } = req.query;
    
    // 영업자 목록 조회
    const salespersons = db.prepare(`
      SELECT id, name, employee_code 
      FROM employees 
      WHERE user_id IN (SELECT id FROM users WHERE role IN ('salesperson', 'admin'))
    `).all();

    const performance = salespersons.map(sp => {
      let query = `
        SELECT 
          COUNT(*) as total_db,
          SUM(CASE WHEN meeting_status = '미팅완료' THEN 1 ELSE 0 END) as meeting_completed,
          SUM(CASE WHEN contract_status = '계약완료' THEN 1 ELSE 0 END) as contract_completed,
          SUM(CASE WHEN contract_status = '계약완료' THEN COALESCE(actual_sales, 0) ELSE 0 END) as total_amount
        FROM sales_db
        WHERE salesperson_id = (SELECT id FROM users WHERE name = ?)
      `;
      const params = [sp.name];

      if (year && month && mode === '이번 달') {
        query += ` AND strftime('%Y', proposal_date) = ? AND strftime('%m', proposal_date) = ?`;
        params.push(year, month.padStart(2, '0'));
      }

      const stats = db.prepare(query).get(...params);
      const successRate = stats.total_db > 0 ? (stats.contract_completed / stats.total_db * 100).toFixed(1) : 0;

      return {
        salesperson: sp.name,
        employee_code: sp.employee_code,
        total_db: stats.total_db || 0,
        meeting_completed: stats.meeting_completed || 0,
        contract_completed: stats.contract_completed || 0,
        total_amount: stats.total_amount || 0,
        success_rate: successRate
      };
    });

    // 전체 통계
    const totalStats = performance.reduce((acc, p) => ({
      total_db: acc.total_db + p.total_db,
      meeting_completed: acc.meeting_completed + p.meeting_completed,
      contract_completed: acc.contract_completed + p.contract_completed,
      total_amount: acc.total_amount + p.total_amount
    }), { total_db: 0, meeting_completed: 0, contract_completed: 0, total_amount: 0 });

    res.json({ success: true, data: performance, stats: totalStats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 매출거래처 관리 API
// ============================================

// 매출거래처 목록 조회
app.get('/api/sales-clients', (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM sales_clients WHERE 1=1';
    const params = [];

    if (status && status !== '전체') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (client_name LIKE ? OR representative LIKE ? OR client_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const clients = stmt.all(...params);

    res.json({ success: true, data: clients });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 등록
app.post('/api/sales-clients', (req, res) => {
  try {
    const { client_name, client_code, representative, contact, address, business_type, commission_rate, notes, status } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO sales_clients 
      (client_name, client_code, representative, contact, address, business_type, commission_rate, notes, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(client_name, client_code, representative, contact, address, business_type, commission_rate || 0, notes, status || 'active');
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 수정
app.put('/api/sales-clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { client_name, client_code, representative, contact, address, business_type, commission_rate, notes, status } = req.body;
    
    const stmt = db.prepare(`
      UPDATE sales_clients 
      SET client_name = ?, client_code = ?, representative = ?, contact = ?, address = ?, 
          business_type = ?, commission_rate = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(client_name, client_code, representative, contact, address, business_type, commission_rate, notes, status, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 매출거래처 삭제
app.delete('/api/sales-clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM sales_clients WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 공지사항 관리 API
// ============================================

// 공지사항 목록 조회
app.get('/api/notices', (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT n.*, u.name as author_name 
      FROM notices n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY n.is_pinned DESC, n.created_at DESC';

    const stmt = db.prepare(query);
    const notices = stmt.all(...params);

    res.json({ success: true, data: notices });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 등록
app.post('/api/notices', (req, res) => {
  try {
    const { title, content, author_id, is_important, is_pinned } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO notices 
      (title, content, author_id, is_important, is_pinned) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, content, author_id, is_important ? 1 : 0, is_pinned ? 1 : 0);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 수정
app.put('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_important, is_pinned } = req.body;
    
    const stmt = db.prepare(`
      UPDATE notices 
      SET title = ?, content = ?, is_important = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(title, content, is_important ? 1 : 0, is_pinned ? 1 : 0, id);
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 삭제
app.delete('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM notices WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 공지사항 조회수 증가
app.post('/api/notices/:id/view', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('UPDATE notices SET view_count = view_count + 1 WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 계정 변경 승인 API
// ============================================

// 계정 변경 요청 목록 조회
app.get('/api/account-change-requests', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT acr.*, u.name as user_name, u.username, a.name as approver_name
      FROM account_change_requests acr
      LEFT JOIN users u ON acr.user_id = u.id
      LEFT JOIN users a ON acr.approved_by = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== '전체') {
      query += ' AND acr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY acr.created_at DESC';

    const stmt = db.prepare(query);
    const requests = stmt.all(...params);

    res.json({ success: true, data: requests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 계정 변경 요청 등록
app.post('/api/account-change-requests', (req, res) => {
  try {
    const { user_id, request_type, current_value, new_value, reason } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO account_change_requests 
      (user_id, request_type, current_value, new_value, reason) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(user_id, request_type, current_value, new_value, reason);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 계정 변경 요청 승인/거부
app.put('/api/account-change-requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by } = req.body;
    
    const stmt = db.prepare(`
      UPDATE account_change_requests 
      SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(status, approved_by, id);
    
    // 승인된 경우 실제 변경 적용
    if (status === 'approved') {
      const request = db.prepare('SELECT * FROM account_change_requests WHERE id = ?').get(id);
      
      if (request.request_type === 'password') {
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(request.new_value, request.user_id);
      } else if (request.request_type === 'role') {
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(request.new_value, request.user_id);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 전체 수수료 요약 API
// ============================================

app.get('/api/commission-summary', (req, res) => {
  try {
    const { year, month } = req.query;
    
    // 기본 쿼리 - 계약 정보
    let contractQuery = `
      SELECT 
        sd.id,
        sd.company_name,
        sd.contract_status,
        sd.actual_sales,
        sd.commission_rate,
        sd.proposer,
        u.name as salesperson_name,
        sc.client_name as sales_client_name,
        sd.contract_date
      FROM sales_db sd
      LEFT JOIN users u ON sd.salesperson_id = u.id
      LEFT JOIN sales_clients sc ON sd.sales_client_id = sc.id
      WHERE sd.contract_status = '계약완료'
    `;
    
    const params = [];
    
    if (year && month) {
      contractQuery += ` AND strftime('%Y', sd.contract_date) = ? AND strftime('%m', sd.contract_date) = ?`;
      params.push(year, month.padStart(2, '0'));
    }
    
    const contracts = db.prepare(contractQuery).all(...params);
    
    // 수수료 계산
    const commissionData = contracts.map(c => ({
      ...c,
      commission_amount: (c.actual_sales || 0) * (c.commission_rate || 0) / 100
    }));
    
    // 통계
    const stats = {
      totalContracts: contracts.length,
      totalSales: commissionData.reduce((sum, c) => sum + (c.actual_sales || 0), 0),
      totalCommission: commissionData.reduce((sum, c) => sum + c.commission_amount, 0),
      avgCommissionRate: contracts.length > 0 
        ? commissionData.reduce((sum, c) => sum + (c.commission_rate || 0), 0) / contracts.length 
        : 0
    };
    
    res.json({ success: true, data: commissionData, stats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 월별 실적 현황 API
// ============================================

app.get('/api/monthly-performance', (req, res) => {
  try {
    const { year, month, contract_status, client } = req.query;
    
    let query = `
      SELECT 
        sd.id,
        sd.proposal_date,
        sd.proposer,
        u.name as salesperson_name,
        sd.company_name,
        sd.representative,
        sd.contact,
        sd.meeting_status,
        sd.contract_status,
        sd.contract_client,
        sd.actual_sales,
        sd.commission_rate
      FROM sales_db sd
      LEFT JOIN users u ON sd.salesperson_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (year && month) {
      query += ` AND strftime('%Y', sd.proposal_date) = ? AND strftime('%m', sd.proposal_date) = ?`;
      params.push(year, month.padStart(2, '0'));
    }
    
    if (contract_status && contract_status !== '전체') {
      query += ' AND sd.contract_status = ?';
      params.push(contract_status);
    }
    
    if (client && client !== '전체') {
      query += ' AND sd.contract_client = ?';
      params.push(client);
    }
    
    query += ' ORDER BY sd.proposal_date DESC';
    
    const data = db.prepare(query).all(...params);
    
    // 통계 계산
    const stats = {
      total: data.length,
      contracted: data.filter(d => d.contract_status === '계약완료').length,
      notContracted: data.filter(d => d.contract_status === '미계약').length,
      meetingCompleted: data.filter(d => d.meeting_status === '미팅완료').length,
      totalAmount: data.reduce((sum, d) => sum + (d.actual_sales || 0), 0),
      correctionCount: 0,
      correctionRefund: 0
    };
    
    // 경정청구 통계 추가
    if (year && month) {
      const correctionStats = db.prepare(`
        SELECT COUNT(*) as count, SUM(refund_amount) as total_refund
        FROM correction_requests
        WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ?
      `).get(year, month.padStart(2, '0'));
      
      stats.correctionCount = correctionStats.count || 0;
      stats.correctionRefund = correctionStats.total_refund || 0;
    }
    
    res.json({ success: true, data, stats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// 섭외자 개인별 실적 API
// ============================================

app.get('/api/recruiter-performance', (req, res) => {
  try {
    const { year, month } = req.query;
    
    // 섭외자별 통계
    let query = `
      SELECT 
        proposer,
        COUNT(*) as total_proposed,
        SUM(CASE WHEN meeting_status = '미팅완료' THEN 1 ELSE 0 END) as meeting_completed,
        SUM(CASE WHEN contract_status = '계약완료' THEN 1 ELSE 0 END) as contract_completed,
        SUM(CASE WHEN contract_status = '계약완료' THEN COALESCE(actual_sales, 0) ELSE 0 END) as total_amount
      FROM sales_db
      WHERE proposer IS NOT NULL AND proposer != ''
    `;
    
    const params = [];
    
    if (year && month) {
      query += ` AND strftime('%Y', proposal_date) = ? AND strftime('%m', proposal_date) = ?`;
      params.push(year, month.padStart(2, '0'));
    }
    
    query += ' GROUP BY proposer ORDER BY total_proposed DESC';
    
    const recruiters = db.prepare(query).all(...params);
    
    // 성공률 계산
    const performance = recruiters.map(r => ({
      ...r,
      success_rate: r.total_proposed > 0 ? (r.contract_completed / r.total_proposed * 100).toFixed(1) : 0
    }));
    
    // 전체 통계
    const totalStats = performance.reduce((acc, p) => ({
      total_proposed: acc.total_proposed + p.total_proposed,
      meeting_completed: acc.meeting_completed + p.meeting_completed,
      contract_completed: acc.contract_completed + p.contract_completed,
      total_amount: acc.total_amount + p.total_amount
    }), { total_proposed: 0, meeting_completed: 0, contract_completed: 0, total_amount: 0 });
    
    res.json({ success: true, data: performance, stats: totalStats });
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

