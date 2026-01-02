import React, { useState, useEffect } from 'react';
import { UserPlus, Save, Edit, Trash2 } from 'lucide-react';

interface Salesperson {
  id: number;
  name: string;
  employee_code: string;
  phone: string;
  email: string;
  commission_rate: number;
  status: string;
  created_at: string;
}

const SalespersonRegister: React.FC = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    employee_code: '',
    phone: '',
    email: '',
    commission_rate: '',
  });

  useEffect(() => {
    fetchSalespersons();
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/salespersons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          commission_rate: parseFloat(formData.commission_rate) || 0,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('영업자가 성공적으로 등록되었습니다.');
        setFormData({
          name: '',
          employee_code: '',
          phone: '',
          email: '',
          commission_rate: '',
        });
        fetchSalespersons();
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('영업자 등록 실패:', error);
      alert('영업자 등록 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/salespersons/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        alert('삭제되었습니다.');
        fetchSalespersons();
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        활성
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        비활성
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <UserPlus className="w-6 h-6 mr-2" />
          영업자 DB 입력
        </h1>
        <p className="text-gray-600 mt-1">영업자 정보를 등록하고 관리하세요</p>
      </div>

      {/* 등록 폼 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">영업자 등록</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사원번호
              </label>
              <input
                type="text"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사원번호를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수수료율 (%)
              </label>
              <input
                type="number"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 10.5"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setFormData({
                name: '',
                employee_code: '',
                phone: '',
                email: '',
                commission_rate: '',
              })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              등록
            </button>
          </div>
        </form>
      </div>

      {/* 영업자 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">등록된 영업자 목록</h2>
        
        {salespersons.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 영업자가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사원번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수수료율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salespersons.map((sp) => (
                  <tr key={sp.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sp.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sp.employee_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sp.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sp.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sp.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sp.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDelete(sp.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalespersonRegister;

