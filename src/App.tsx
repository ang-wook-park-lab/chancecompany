import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// 인사관리
import Employees from './pages/hr/Employees';
import AttendancePage from './pages/hr/Attendance';
import LeaveCalendar from './pages/hr/LeaveCalendar';
import Leaves from './pages/hr/Leaves';

// 관리자 - 영업자 일정/메모 관리
import SalespersonSchedules from './pages/admin/SalespersonSchedules';

// DB관리
import SalesDBRegister from './pages/sales-db/Register';
import SalesDBSearch from './pages/sales-db/Search';

// 영업자 관리
import SalespersonCommissionStatement from './pages/salesperson/CommissionStatement';
import SalespersonRegister from './pages/salesperson/Register';
import ScheduleManagement from './pages/salesperson/ScheduleManagement';
import MemoManagement from './pages/salesperson/MemoManagement';

// 계약 관리
import SalesCommission from './pages/contract/SalesCommission';
import RecruitmentCommission from './pages/contract/RecruitmentCommission';

// 설정
import AccountSettings from './pages/settings/AccountSettings';
import CompanySettings from './pages/settings/CompanySettings';

// 출퇴근
import ClockIn from './pages/attendance/ClockIn';
import ClockOut from './pages/attendance/ClockOut';
import LeaveRequest from './pages/attendance/LeaveRequest';

// 해피콜
import HappyCallList from './pages/happycall/List';

// 경정청구
import CorrectionList from './pages/correction/List';

// 관리자 - 실적 및 수수료
import MonthlyPerformance from './pages/admin/MonthlyPerformance';
import SalespersonPerformance from './pages/admin/SalespersonPerformance';
import CommissionSummary from './pages/admin/CommissionSummary';
import SalesClients from './pages/admin/SalesClients';
import RecruiterPerformance from './pages/admin/RecruiterPerformance';
import AccountChangeApproval from './pages/admin/AccountChangeApproval';
import NoticeManagement from './pages/admin/NoticeManagement';

// 설정 - 내 정보
import MyAccount from './pages/settings/MyAccount';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* 출퇴근 */}
            <Route path="attendance/clock-in" element={<ClockIn />} />
            <Route path="attendance/clock-out" element={<ClockOut />} />
            <Route path="attendance/leave-request" element={<LeaveRequest />} />
            
            {/* 인사관리 */}
            <Route path="hr/employees" element={<Employees />} />
            <Route path="hr/attendance" element={<AttendancePage />} />
            <Route path="hr/attendance-status" element={<LeaveCalendar />} />
            <Route path="hr/leaves" element={<Leaves />} />
            
            {/* 관리자 - 영업자 일정/메모 */}
            <Route path="admin/salesperson-schedules" element={<SalespersonSchedules />} />
            
            {/* DB관리 */}
            <Route path="sales-db/register" element={<SalesDBRegister />} />
            <Route path="sales-db/search" element={<SalesDBSearch />} />
            
            {/* 영업자 관리 */}
            <Route path="salesperson/commission-statement" element={<SalespersonCommissionStatement />} />
            <Route path="salesperson/register" element={<SalespersonRegister />} />
            <Route path="salesperson/schedules" element={<ScheduleManagement />} />
            <Route path="salesperson/memos" element={<MemoManagement />} />
            
            {/* 계약 관리 */}
            <Route path="contract/sales-commission" element={<SalesCommission />} />
            <Route path="contract/recruitment-commission" element={<RecruitmentCommission />} />
            
            {/* 설정 */}
            <Route path="settings/accounts" element={<AccountSettings />} />
            <Route path="settings/company" element={<CompanySettings />} />
            
            {/* 해피콜 */}
            <Route path="happycall/list" element={<HappyCallList />} />
            
            {/* 경정청구 */}
            <Route path="correction/list" element={<CorrectionList />} />
            
            {/* 관리자 - 실적 및 수수료 */}
            <Route path="admin/monthly-performance" element={<MonthlyPerformance />} />
            <Route path="admin/salesperson-performance" element={<SalespersonPerformance />} />
            <Route path="admin/commission-summary" element={<CommissionSummary />} />
            <Route path="admin/sales-clients" element={<SalesClients />} />
            <Route path="admin/recruiter-performance" element={<RecruiterPerformance />} />
            <Route path="admin/account-change-approval" element={<AccountChangeApproval />} />
            <Route path="admin/notice-management" element={<NoticeManagement />} />
            
            {/* 설정 - 내 정보 */}
            <Route path="settings/my-account" element={<MyAccount />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
