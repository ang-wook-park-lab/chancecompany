import React, { useState, useEffect } from 'react';
import { FileText, Plus, DollarSign } from 'lucide-react';

interface Salesperson {
  id: number;
  name: string;
}

interface CommissionStatement {
  id: number;
  salesperson_id: number;
  salesperson_name: string;
  period_start: string;
  period_end: string;
  total_sales: number;
  total_commission: number;
  payment_date: string;
  payment_status: string;
  created_at: string;
}

const SalespersonCommissionStatement: React.FC = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [statements, setStatements] = useState<CommissionStatement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    salesperson_id: '',
    period_start: '',
    period_end: '',
    total_sales: '',
    total_commission: '',
  });

  useEffect(() => {
    fetchSalespersons();
    fetchStatements();
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

  const fetchStatements = async () => {
    try {
      const response = await fetch('/api/commission-statements');
      const result = await response.json();
      if (result.success) {
        setStatements(result.data);
      }
    } catch (error) {
      console.error('수수료 명세서 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/commission-statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: parseInt(formData.salesperson_id),
          period_start: formData.period_start,
          period_end: formData.period_end,
          total_sales: parseInt(formData.total_sales) || 0,
          total_commission: parseInt(formData.total_commission) || 0,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('수수료 명세서가 생성되었습니다.');
        setFormData({
          salesperson_id: '',
          period_start: '',
          period_end: '',
          total_sales: '',
          total_commission: '',
        });
        setShowForm(false);
        fetchStatements();
      } else {
        alert('생성 실패: ' + result.message);
      }
    } catch (error) {
      console.error('명세서 생성 실패:', error);
      alert('명세서 생성 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadge = (status: string) => {
    return status === 'paid' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        지급완료
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        미지급
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              영업자 수수료 명세서
            </h1>
            <p className="text-gray-600 mt-1">영업자별 수수료를 관리하세요</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            명세서 생성
          </button>
        </div>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">수수료 명세서 생성</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  영업자 <span className="text-red-500">*</span>
                </label>
                <select
                  name="salesperson_id"
                  value={formData.salesperson_id}
                  onChange={handleChange}
                  required
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

              <div></div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="period_start"
                  value={formData.period_start}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="period_end"
                  value={formData.period_end}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 매출액
                </label>
                <input
                  type="number"
                  name="total_sales"
                  value={formData.total_sales}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 수수료
                </label>
                <input
                  type="number"
                  name="total_commission"
                  value={formData.total_commission}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 명세서 목록 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">수수료 명세서 목록</h2>
        
        {statements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            생성된 명세서가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statements.map((stmt) => (
              <div key={stmt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{stmt.salesperson_name}</h3>
                    <p className="text-sm text-gray-600">
                      {stmt.period_start} ~ {stmt.period_end}
                    </p>
                  </div>
                  {getStatusBadge(stmt.payment_status)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 매출:</span>
                    <span className="font-medium text-gray-800">{formatCurrency(stmt.total_sales)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">수수료:</span>
                    <span className="font-semibold text-blue-600 text-lg">
                      <DollarSign className="w-4 h-4 inline" />
                      {formatCurrency(stmt.total_commission)}
                    </span>
                  </div>
                </div>

                {stmt.payment_date && (
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    지급일: {stmt.payment_date}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalespersonCommissionStatement;

