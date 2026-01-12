import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

interface CommissionData {
  id: number;
  company_name: string;
  contract_status: string;
  actual_sales: number;
  commission_rate: number;
  proposer: string;
  salesperson_name: string;
  sales_client_name: string;
  contract_date: string;
  commission_amount: number;
}

const CommissionSummary: React.FC = () => {
  const [data, setData] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [stats, setStats] = useState({
    totalContracts: 0,
    totalSales: 0,
    totalCommission: 0,
    avgCommissionRate: 0
  });

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year, month });

      const response = await fetch(`/api/commission-summary?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('수수료 요약 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold">전체 수수료 요약</h1>
        </div>
        <p className="text-gray-600">전체 계약 수수료를 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-600">조회 기간:</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} className="border rounded px-3 py-2">
            {Array.from({ length: 11 }, (_, i) => 2021 + i).map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">총 계약 건수</div>
          <div className="text-3xl font-bold">{stats.totalContracts}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">총 매출</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalSales)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">총 수수료</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCommission)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">평균 수수료율</div>
          <div className="text-3xl font-bold text-purple-600">{stats.avgCommissionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">섭외자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">영업자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출거래처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기장료</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료율</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료 금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">로딩 중...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">데이터가 없습니다.</td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{row.company_name}</td>
                  <td className="px-4 py-3 text-sm">{row.proposer || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.salesperson_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.sales_client_name || '-'}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(row.actual_sales)}</td>
                  <td className="px-4 py-3 text-sm">{row.commission_rate}%</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    {formatCurrency(row.commission_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.contract_date || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionSummary;

