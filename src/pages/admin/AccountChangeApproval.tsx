import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { AccountChangeRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';

const AccountChangeApproval: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccountChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== '전체') params.append('status', statusFilter);

      const response = await fetch(`/api/account-change-requests?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('계정 변경 요청 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('이 요청을 승인하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/account-change-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', approved_by: user?.id })
      });

      const data = await response.json();
      if (data.success) {
        alert('승인되었습니다.');
        fetchRequests();
      }
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('이 요청을 거부하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/account-change-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', approved_by: user?.id })
      });

      const data = await response.json();
      if (data.success) {
        alert('거부되었습니다.');
        fetchRequests();
      }
    } catch (error) {
      console.error('거부 실패:', error);
      alert('거부에 실패했습니다.');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const getRequestTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'password': '비밀번호 변경',
      'info': '정보 변경',
      'role': '권한 변경'
    };
    return types[type] || type;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold">계정 변경 승인</h1>
        </div>
        <p className="text-gray-600">직원들의 계정 변경 요청을 검토하고 승인하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            대기중
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded ${statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            승인됨
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded ${statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            거부됨
          </button>
          <button
            onClick={() => setStatusFilter('전체')}
            className={`px-4 py-2 rounded ${statusFilter === '전체' ? 'bg-gray-600 text-white' : 'bg-gray-100'}`}
          >
            전체
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">변경 유형</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기존 값</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">새 값</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">로딩 중...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">요청이 없습니다.</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{request.user_name}</td>
                  <td className="px-4 py-3 text-sm">{request.username}</td>
                  <td className="px-4 py-3 text-sm">{getRequestTypeName(request.request_type)}</td>
                  <td className="px-4 py-3 text-sm">{request.current_value || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{request.new_value || '-'}</td>
                  <td className="px-4 py-3 text-sm">{request.reason || '-'}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(request.created_at || '')}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'approved' ? '승인됨' :
                       request.status === 'rejected' ? '거부됨' : '대기중'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id!)}
                          className="p-1 hover:bg-green-100 rounded"
                          title="승인"
                        >
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id!)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="거부"
                        >
                          <XCircle className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountChangeApproval;

