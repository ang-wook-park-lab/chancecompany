import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit, Trash2, X } from 'lucide-react';

interface SalesClient {
  id?: number;
  client_name: string;
  commission_rate: number;
  description?: string;
}

const SalesClients: React.FC = () => {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<SalesClient | null>(null);
  const [formData, setFormData] = useState<SalesClient>({
    client_name: '',
    commission_rate: 500,
    description: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales-clients');
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('매출거래처 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingClient(null);
    setFormData({ client_name: '', commission_rate: 500, description: '' });
    setShowModal(true);
  };

  const handleEdit = (client: SalesClient) => {
    setEditingClient(client);
    setFormData(client);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 거래처를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/sales-clients/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchClients();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.client_name || formData.commission_rate <= 0) {
      alert('거래처명과 수수료율을 입력하세요.');
      return;
    }

    try {
      const url = editingClient ? `/api/sales-clients/${editingClient.id}` : '/api/sales-clients';
      const method = editingClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        alert(editingClient ? '수정되었습니다.' : '등록되었습니다.');
        setShowModal(false);
        fetchClients();
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">매출거래처 관리</h1>
            <p className="text-gray-600 mt-1">거래처별 수수료율(%)을 관리합니다 (예: 600% = 계약기장료의 6배)</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            거래처 추가
          </button>
        </div>
      </div>

      {/* 거래처 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">거래처명</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">수수료율 (%)</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">설명</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">로딩 중...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">등록된 거래처가 없습니다.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{client.client_name}</td>
                  <td className="px-6 py-4 text-sm font-bold">{client.commission_rate}%</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 거래처 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingClient ? '거래처 수정' : '거래처 추가'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거래처명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="예: 기업DB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수수료율 (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  예: 500% = 계약기장료의 5배
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="선택사항"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingClient ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesClients;

