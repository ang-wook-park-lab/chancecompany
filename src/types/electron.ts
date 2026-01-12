export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'employee' | 'salesperson' | 'recruiter';
  password?: string;
  workType?: '사무직' | '생산직' | '외근직';
  workLocation?: string;
}

export interface Product {
  id?: number;
  barcode: string;
  product_name: string;
  quantity: number;
  consumer_price: number;
  purchase_price: number;
  month?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id?: number;
  user_id?: number;
  employee_code: string;
  department?: string;
  position?: string;
  hire_date?: string;
  phone?: string;
  email?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface Attendance {
  id?: number;
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
}

export interface Leave {
  id?: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface HappyCall {
  id?: number;
  client_name: string;
  phone?: string;
  satisfaction_level: '상' | '중' | '하';
  content?: string;
  handler?: string;
  salesperson_name?: string;
  call_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CorrectionRequest {
  id?: number;
  company_name: string;
  representative?: string;
  handler?: string;
  special_relationship?: string;
  is_first_startup: boolean;
  status: '대기' | '환급가능' | '환급불가' | '자료수집X';
  progress_status?: string;
  refund_amount: number;
  document_delivery?: string;
  feedback?: string;
  sales_db_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalesClient {
  id?: number;
  client_name: string;
  client_code?: string;
  representative?: string;
  contact?: string;
  address?: string;
  business_type?: string;
  commission_rate: number;
  notes?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Notice {
  id?: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  is_important: boolean;
  is_pinned: boolean;
  view_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AccountChangeRequest {
  id?: number;
  user_id: number;
  user_name?: string;
  username?: string;
  request_type: 'password' | 'info' | 'role';
  current_value?: string;
  new_value?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approver_name?: string;
  approved_at?: string;
  created_at?: string;
}

export interface ElectronAPI {
  login: (credentials: { username: string; password: string }) => Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }>;
  products: {
    getAll: () => Promise<{ success: boolean; data?: Product[]; message?: string }>;
    create: (product: Product) => Promise<{ success: boolean; id?: number; message?: string }>;
    update: (id: number, product: Product) => Promise<{ success: boolean; message?: string }>;
    delete: (id: number) => Promise<{ success: boolean; message?: string }>;
    import: (products: Product[]) => Promise<{ success: boolean; count?: number; message?: string }>;
    importCSV: () => Promise<{ success: boolean; count?: number; message?: string }>;
  };
  employees: {
    getAll: () => Promise<{ success: boolean; data?: Employee[]; message?: string }>;
  };
  attendance: {
    getAll: () => Promise<{ success: boolean; data?: Attendance[]; message?: string }>;
  };
  leaves: {
    getAll: () => Promise<{ success: boolean; data?: Leave[]; message?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

