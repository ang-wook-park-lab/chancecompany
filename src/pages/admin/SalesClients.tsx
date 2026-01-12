import React, { useState, useEffect } from 'react';
import { Building, Search, Plus } from 'lucide-react';
import { SalesClient } from '../../types';

const SalesClients: React.FC = () => {
  const [clients, setClients] = useState<SalesClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== '전체') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/sales-clients?${params.toString()}`);
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">매출거래처 관리</h1>
            </div>
            <p className="text-gray-600">매출거래처 정보를 관리하세요</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            새 거래처 등록
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="전체">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="거래처명, 대표자, 코드로 검색..."
              className="flex-1 border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">거래처명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">거래처 코드</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">업종</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료율</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">로딩 중...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">등록된 매출거래처가 없습니다.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{client.client_name}</td>
                  <td className="px-4 py-3 text-sm">{client.client_code || '-'}</td>
                  <td className="px-4 py-3 text-sm">{client.representative || '-'}</td>
                  <td className="px-4 py-3 text-sm">{client.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm">{client.business_type || '-'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-blue-600">{client.commission_rate}%</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status === 'active' ? '활성' : '비활성'}
                    </span>
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

export default SalesClients;

