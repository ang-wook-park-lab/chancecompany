import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProductRegister from './pages/inventory/ProductRegister';
import ProductList from './pages/inventory/ProductList';
import InventoryStatus from './pages/inventory/InventoryStatus';
import InventorySales from './pages/inventory/InventorySales';
import InventoryRegister from './pages/inventory/InventoryRegister';
import ClientRegister from './pages/inventory/ClientRegister';
import Employees from './pages/hr/Employees';
import AttendancePage from './pages/hr/Attendance';
import Leaves from './pages/hr/Leaves';
import AccountSettings from './pages/settings/AccountSettings';
import CompanySettings from './pages/settings/CompanySettings';
import ClockIn from './pages/attendance/ClockIn';
import ClockOut from './pages/attendance/ClockOut';
import LeaveRequest from './pages/attendance/LeaveRequest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance/clock-in" element={<ClockIn />} />
            <Route path="attendance/clock-out" element={<ClockOut />} />
            <Route path="attendance/leave-request" element={<LeaveRequest />} />
            <Route path="inventory" element={<ProductRegister />} />
            <Route path="inventory/status" element={<InventoryStatus />} />
            <Route path="inventory/sales" element={<InventorySales />} />
            <Route path="inventory/list" element={<ProductList />} />
            <Route path="inventory/register" element={<InventoryRegister />} />
            <Route path="inventory/clients" element={<ClientRegister />} />
            <Route path="hr/employees" element={<Employees />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/attendance-status" element={<AttendancePage />} />
            <Route path="hr/leaves" element={<Leaves />} />
            <Route path="settings/accounts" element={<AccountSettings />} />
            <Route path="settings/company" element={<CompanySettings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
