import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';

interface SalesDB {
  id: number;
  customer_name: string;
  customer_company: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  salesperson_name: string;
  notes: string;
  created_at: string;
}

const SalesDBSearch: React.FC = () => {
  const [salesDB, setSalesDB] = useState<SalesDB[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<SalesDB[]>([]);

  useEffect(() => {
    fetchSalesDB();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = salesDB.filter(
        (item) =>
          item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.phone?.includes(searchTerm)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(salesDB);
    }
  }, [searchTerm, salesDB]);

  const fetchSalesDB = async () => {
    try {
      const response = await fetch('/api/sales-db');
      const result = await response.json();
      if (result.success) {
        setSalesDB(result.data);
        setFilteredData(result.data);
      }
    } catch (error) {
      console.error('DB 조회 실패:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/sales-db/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchSalesDB();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      active: '활성',
      inactive: '비활성',
      pending: '대기',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <SearchIcon className="w-6 h-6 mr-2" />
          DB 검색
        </h1>
        <p className="text-gray-600 mt-1">등록된 고객 정보를 검색하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="고객명, 회사명, 전화번호로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 <span className="font-semibold text-blue-600">{filteredData.length}</span>개
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{item.customer_name}</h3>
                    {item.customer_company && (
                      <p className="text-sm text-gray-600">{item.customer_company}</p>
                    )}
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div className="space-y-2 mb-3">
                  {item.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {item.phone}
                    </div>
                  )}
                  {item.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {item.email}
                    </div>
                  )}
                  {item.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {item.address}
                    </div>
                  )}
                </div>

                {item.salesperson_name && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-600">담당: </span>
                    <span className="font-medium text-gray-800">{item.salesperson_name}</span>
                  </div>
                )}

                {item.notes && (
                  <div className="mb-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {item.notes}
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    onClick={() => handleDelete(item.id)}
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesDBSearch;

