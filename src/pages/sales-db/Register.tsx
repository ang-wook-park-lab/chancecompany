import React, { useState, useEffect } from 'react';
import { UserPlus, Save } from 'lucide-react';

interface Salesperson {
  id: number;
  name: string;
}

const SalesDBRegister: React.FC = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_company: '',
    phone: '',
    email: '',
    address: '',
    salesperson_id: '',
    notes: '',
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
      const response = await fetch('/api/sales-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salesperson_id: formData.salesperson_id ? parseInt(formData.salesperson_id) : null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('DB가 성공적으로 등록되었습니다.');
        setFormData({
          customer_name: '',
          customer_company: '',
          phone: '',
          email: '',
          address: '',
          salesperson_id: '',
          notes: '',
        });
      } else {
        alert('등록 실패: ' + result.message);
      }
    } catch (error) {
      console.error('DB 등록 실패:', error);
      alert('DB 등록 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <UserPlus className="w-6 h-6 mr-2" />
          DB 등록
        </h1>
        <p className="text-gray-600 mt-1">고객 정보를 등록하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="고객명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                회사명
              </label>
              <input
                type="text"
                name="customer_company"
                value={formData.customer_company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="회사명을 입력하세요"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="주소를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당 영업자
              </label>
              <select
                name="salesperson_id"
                value={formData.salesperson_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                {salespersons.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="추가 정보를 입력하세요"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setFormData({
                customer_name: '',
                customer_company: '',
                phone: '',
                email: '',
                address: '',
                salesperson_id: '',
                notes: '',
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
    </div>
  );
};

export default SalesDBRegister;

