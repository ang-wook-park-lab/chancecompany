import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, X, Save, Edit } from 'lucide-react';
import { CorrectionRequest } from '../../types';

const CorrectionList: React.FC = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    possible: 0,
    impossible: 0,
    totalRefund: 0
  });

  const [formData, setFormData] = useState<CorrectionRequest>({
    company_name: '',
    representative: '',
    handler: '',
    is_first_startup: false,
    status: '대기',
    progress_status: '',
    refund_amount: 0,
    document_delivery: '',
    feedback: ''
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

  const handleOpenNewModal = () => {
    setFormData({
      company_name: '',
      representative: '',
      handler: '',
      is_first_startup: false,
      status: '대기',
      progress_status: '',
      refund_amount: 0,
      document_delivery: '',
      feedback: ''
    });
    setShowModal(true);
  };

  const handleOpenDetailModal = (request: CorrectionRequest) => {
    setSelectedRequest(request);
    setFormData(request);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const handleSubmit = async () => {
    try {
      const url = selectedRequest 
        ? `/api/correction-requests/${selectedRequest.id}`
        : '/api/correction-requests';
      
      const method = selectedRequest ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedRequest ? '수정되었습니다.' : '등록되었습니다.');
        handleCloseModal();
        fetchRequests();
        fetchStats();
      } else {
        alert('오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/correction-requests/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('삭제되었습니다.');
        handleCloseModal();
        fetchRequests();
        fetchStats();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
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

  const Modal = ({ isDetail = false }: { isDetail?: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isDetail ? '경정청구 상세' : '새 요청 등록'}
          </h2>
          <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업체명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="업체명 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대표자</label>
              <input
                type="text"
                value={formData.representative || ''}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="대표자명 입력"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
              <input
                type="text"
                value={formData.handler || ''}
                onChange={(e) => setFormData({ ...formData, handler: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="담당자명 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최초창업</label>
              <select
                value={formData.is_first_startup ? 'Y' : 'N'}
                onChange={(e) => setFormData({ ...formData, is_first_startup: e.target.value === 'Y' })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="N">아니오</option>
                <option value="Y">예</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="대기">대기</option>
                <option value="환급가능">환급가능</option>
                <option value="환급불가">환급불가</option>
                <option value="자료수집X">자료수집X</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">진행상태</label>
              <input
                type="text"
                value={formData.progress_status || ''}
                onChange={(e) => setFormData({ ...formData, progress_status: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="진행상태 입력"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">환급금액</label>
              <input
                type="number"
                value={formData.refund_amount}
                onChange={(e) => setFormData({ ...formData, refund_amount: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-3 py-2"
                placeholder="환급금액 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">서류전달일</label>
              <input
                type="date"
                value={formData.document_delivery || ''}
                onChange={(e) => setFormData({ ...formData, document_delivery: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">피드백</label>
            <textarea
              value={formData.feedback || ''}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="피드백 내용 입력"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          {isDetail && (
            <button
              onClick={() => handleDelete(selectedRequest!.id!)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              삭제
            </button>
          )}
          <div className={`flex gap-2 ${!isDetail ? 'ml-auto' : ''}`}>
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isDetail ? '수정' : '등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
          <button 
            onClick={handleOpenNewModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
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
                <tr 
                  key={request.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenDetailModal(request)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{request.company_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.representative || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.handler || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {request.is_first_startup ? <span className="text-green-600 font-bold">O</span> : <span className="text-gray-400">X</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.progress_status || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">{formatCurrency(request.refund_amount)}</td>
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

      {/* Modals */}
      {showModal && <Modal />}
      {showDetailModal && <Modal isDetail={true} />}
    </div>
  );
};

export default CorrectionList;
