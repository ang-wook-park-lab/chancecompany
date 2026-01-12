import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus } from 'lucide-react';
import { CorrectionRequest } from '../../types';

const CorrectionList: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    possible: 0,
    impossible: 0,
    totalRefund: 0
  });

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [statusFilter, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== '전체') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/correction-requests?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('경정청구 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/correction-requests/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '환급가능': return 'bg-green-100 text-green-800';
      case '환급불가': return 'bg-red-100 text-red-800';
      case '자료수집X': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">경정청구 검토</h1>
            </div>
            <p className="text-gray-600">경정청구 요청을 등록하고 검토 결과를 확인하세요</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            새 요청 등록
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setStatusFilter('전체')}
            className={`px-4 py-2 rounded ${statusFilter === '전체' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            전체
          </button>
          <button
            onClick={() => setStatusFilter('대기')}
            className={`px-4 py-2 rounded ${statusFilter === '대기' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            대기
          </button>
          <button
            onClick={() => setStatusFilter('환급가능')}
            className={`px-4 py-2 rounded ${statusFilter === '환급가능' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            환급가능
          </button>
          <button
            onClick={() => setStatusFilter('환급불가')}
            className={`px-4 py-2 rounded ${statusFilter === '환급불가' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            환급불가
          </button>
          <button
            onClick={() => setStatusFilter('자료수집X')}
            className={`px-4 py-2 rounded ${statusFilter === '자료수집X' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            자료수집X
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="업체명, 대표자, 담당자로 검색..."
            className="flex-1 border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대표자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최초창업</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">진행여부</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">환급금액</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">서류전달</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피드백</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  등록된 경정청구 요청이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.representative || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.handler || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.is_first_startup ? '✓' : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.progress_status || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(request.refund_amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.document_delivery || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.feedback || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.created_at ? new Date(request.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">전체 요청</div>
          <div className="text-2xl font-bold">{stats.total}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">환급가능</div>
          <div className="text-2xl font-bold text-green-600">{stats.possible}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">환급불가</div>
          <div className="text-2xl font-bold text-red-600">{stats.impossible}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">총 환급금액</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRefund)}</div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionList;

