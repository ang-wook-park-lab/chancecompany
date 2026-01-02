import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  userId?: number;
  username?: string;
  emergency?: boolean;
  halfDayPeriod?: '오전' | '오후';
}

const Leaves: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  
  // LocalStorage에서 휴가 신청 목록 로드
  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = () => {
    const requests = JSON.parse(localStorage.getItem('erp_leave_requests') || '[]');
    setLeaveRequests(requests);
  };

  // 승인/반려 처리
  const handleApprove = (id: number) => {
    const updatedRequests = leaveRequests.map(req => 
      req.id === id ? { ...req, status: 'approved' as const } : req
    );
    setLeaveRequests(updatedRequests);
    localStorage.setItem('erp_leave_requests', JSON.stringify(updatedRequests));
  };

  const handleReject = (id: number) => {
    const updatedRequests = leaveRequests.map(req => 
      req.id === id ? { ...req, status: 'rejected' as const } : req
    );
    setLeaveRequests(updatedRequests);
    localStorage.setItem('erp_leave_requests', JSON.stringify(updatedRequests));
  };

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  };

  const filteredRequests = filterStatus === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(r => r.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            <span>대기중</span>
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            <span>승인</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            <span>반려</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      '연차': 'bg-blue-100 text-blue-800',
      '반차': 'bg-purple-100 text-purple-800',
      '병가': 'bg-red-100 text-red-800',
      '경조사': 'bg-pink-100 text-pink-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">휴가 관리</h1>
        <p className="text-gray-600 mt-2">직원의 휴가 신청을 관리하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 신청</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}건</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">대기중</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}건</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">승인</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}건</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">반려</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}건</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">필터:</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'all'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                대기중
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                승인
              </button>
              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  filterStatus === 'rejected'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                반려
              </button>
            </div>
          </div>

          {/* Add Button */}
          <button className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
            <Plus className="w-5 h-5" />
            <span>휴가 신청</span>
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직원정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  휴가종류
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  일수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사유
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  신청일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{request.employeeName}</div>
                    <div className="text-xs text-gray-500">{request.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getLeaveTypeBadge(request.leaveType)}
                      {request.leaveType === '반차' && request.halfDayPeriod && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                          {request.halfDayPeriod}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{request.startDate}</div>
                    <div className="text-xs text-gray-500">~ {request.endDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">{request.days}일</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {request.requestDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {request.status === 'pending' && (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition"
                          title="승인"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition"
                          title="반려"
                        >
                          반려
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaves;

