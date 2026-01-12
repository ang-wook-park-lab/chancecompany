import React, { useState, useEffect } from 'react';
import { TrendingUp, Users } from 'lucide-react';

interface PerformanceData {
  salesperson: string;
  employee_code: string;
  total_db: number;
  meeting_completed: number;
  contract_completed: number;
  total_amount: number;
  success_rate: string;
}

const SalespersonPerformance: React.FC = () => {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('이번 달');
  const [year] = useState(new Date().getFullYear().toString());
  const [month] = useState((new Date().getMonth() + 1).toString());
  const [stats, setStats] = useState({
    total_db: 0,
    meeting_completed: 0,
    contract_completed: 0,
    total_amount: 0
  });

  useEffect(() => {
    fetchData();
  }, [mode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year, month, mode });

      const response = await fetch(`/api/salesperson-performance?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('영업자 실적 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getInitial = (name: string) => {
    if (!name) return '';
    return name.charAt(0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">영업자 개인별 실적</h1>
        <p className="text-gray-600">영업자들의 실적을 한눈에 확인하세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">조회 기간:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('이번 달')}
              className={`px-4 py-2 rounded ${mode === '이번 달' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              이번 달
            </button>
            <button
              onClick={() => setMode('특정 월')}
              className={`px-4 py-2 rounded ${mode === '특정 월' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              특정 월
            </button>
            <button
              onClick={() => setMode('평균')}
              className={`px-4 py-2 rounded ${mode === '평균' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              평균
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-600">총 DB 수</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">{stats.total_db}</p>
          <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-600">미팅 완료</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{stats.meeting_completed}</p>
          <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-600">계약 완료</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{stats.contract_completed}</p>
          <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-600">총 계약 기장료</h3>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</p>
          <p className="text-xs text-gray-500 mt-1">&nbsp;</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold">영업자별 상세 실적</h2>
          <span className="text-sm text-gray-500">({year}년 {month}월)</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">영업자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사원번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 DB 수</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">미팅 완료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약 완료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 계약 기장료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성공률</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {getInitial(row.salesperson)}
                        </span>
                      </div>
                      <span className="font-medium">{row.salesperson}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{row.employee_code}</td>
                  <td className="px-6 py-4 text-sm">{row.total_db}</td>
                  <td className="px-6 py-4 text-sm">{row.meeting_completed}</td>
                  <td className="px-6 py-4 text-sm">{row.contract_completed}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium">{formatCurrency(row.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      parseFloat(row.success_rate) >= 70 ? 'bg-green-100 text-green-800' :
                      parseFloat(row.success_rate) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.success_rate}%
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

export default SalespersonPerformance;

