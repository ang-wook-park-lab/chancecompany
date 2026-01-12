import React, { useState, useEffect } from 'react';
import { Phone, Search, Plus, X, Save } from 'lucide-react';
import { HappyCall } from '../../types';

const HappyCallList: React.FC = () => {
  const [happyCalls, setHappyCalls] = useState<HappyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [satisfactionFilter, setSatisfactionFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<HappyCall | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    상: 0,
    중: 0,
    하: 0
  });

  const [formData, setFormData] = useState<HappyCall>({
    client_name: '',
    phone: '',
    satisfaction_level: '상',
    content: '',
    handler: '',
    call_date: new Date().toISOString().split('T')[0],
    salesperson_name: ''
  });

  useEffect(() => {
    fetchHappyCalls();
    fetchStats();
  }, [satisfactionFilter, searchTerm]);

  const fetchHappyCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (satisfactionFilter !== '전체') {
        params.append('satisfaction_level', satisfactionFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/happy-calls?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setHappyCalls(data.data);
      }
    } catch (error) {
      console.error('해피콜 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/happy-calls/stats');
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
      client_name: '',
      phone: '',
      satisfaction_level: '상',
      content: '',
      handler: '',
      call_date: new Date().toISOString().split('T')[0],
      salesperson_name: ''
    });
    setShowModal(true);
  };

  const handleOpenDetailModal = (call: HappyCall) => {
    setSelectedCall(call);
    setFormData(call);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setSelectedCall(null);
  };

  const handleSubmit = async () => {
    try {
      const url = selectedCall 
        ? `/api/happy-calls/${selectedCall.id}`
        : '/api/happy-calls';
      
      const method = selectedCall ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(selectedCall ? '수정되었습니다.' : '등록되었습니다.');
        handleCloseModal();
        fetchHappyCalls();
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
      const response = await fetch(`/api/happy-calls/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('삭제되었습니다.');
        handleCloseModal();
        fetchHappyCalls();
        fetchStats();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getSatisfactionEmoji = (level: string) => {
    switch (level) {
      case '상': return '😊';
      case '중': return '😐';
      case '하': return '😞';
      default: return '';
    }
  };

  const getSatisfactionColor = (level: string) => {
    switch (level) {
      case '상': return 'bg-green-100 text-green-800';
      case '중': return 'bg-yellow-100 text-yellow-800';
      case '하': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const Modal = ({ isDetail = false }: { isDetail?: boolean }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isDetail ? '해피콜 상세' : '새 해피콜 등록'}
          </h2>
          <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="고객명 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="연락처 입력"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                만족도 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.satisfaction_level}
                onChange={(e) => setFormData({ ...formData, satisfaction_level: e.target.value as '상' | '중' | '하' })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="상">😊 상 (매우 만족)</option>
                <option value="중">😐 중 (보통)</option>
                <option value="하">😞 하 (불만족)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">통화일</label>
              <input
                type="date"
                value={formData.call_date || ''}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                className="w-full border rounded px-3 py-2"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">영업자</label>
              <input
                type="text"
                value={formData.salesperson_name || ''}
                onChange={(e) => setFormData({ ...formData, salesperson_name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="영업자명 입력"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">피드백 내용</label>
            <textarea
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="고객 피드백 내용을 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          {isDetail && (
            <button
              onClick={() => handleDelete(selectedCall!.id!)}
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
              <Phone className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">해피콜 관리</h1>
            </div>
            <p className="text-gray-600">고객 해피콜 내역을 확인하고 관리하세요</p>
          </div>
          <button 
            onClick={handleOpenNewModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            새 해피콜 등록
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">전체</div>
          <div className="text-2xl font-bold">{stats.total}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">상 😊</div>
          <div className="text-2xl font-bold text-green-600">{stats.상}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">중 😐</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.중}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">하 😞</div>
          <div className="text-2xl font-bold text-red-600">{stats.하}건</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSatisfactionFilter('전체')}
            className={`px-4 py-2 rounded ${satisfactionFilter === '전체' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            전체
          </button>
          <button
            onClick={() => setSatisfactionFilter('상')}
            className={`px-4 py-2 rounded ${satisfactionFilter === '상' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            😊 상
          </button>
          <button
            onClick={() => setSatisfactionFilter('중')}
            className={`px-4 py-2 rounded ${satisfactionFilter === '중' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
          >
            😐 중
          </button>
          <button
            onClick={() => setSatisfactionFilter('하')}
            className={`px-4 py-2 rounded ${satisfactionFilter === '하' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
          >
            😞 하
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="고객명, 담당자, 영업자로 검색..."
            className="flex-1 border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">만족도</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">영업자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">통화일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">피드백</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : happyCalls.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  등록된 해피콜이 없습니다.
                </td>
              </tr>
            ) : (
              happyCalls.map((call) => (
                <tr 
                  key={call.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleOpenDetailModal(call)}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{call.client_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{call.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSatisfactionColor(call.satisfaction_level)}`}>
                      {getSatisfactionEmoji(call.satisfaction_level)} {call.satisfaction_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{call.handler || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{call.salesperson_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{call.call_date || '-'}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{call.content || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {call.created_at ? new Date(call.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showModal && <Modal />}
      {showDetailModal && <Modal isDetail={true} />}
    </div>
  );
};

export default HappyCallList;
