import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';

interface RecruiterData {
  proposer: string;
  total_proposed: number;
  meeting_completed: number;
  contract_completed: number;
  total_amount: number;
  success_rate: string;
}

const RecruiterPerformance: React.FC = () => {
  const [data, setData] = useState<RecruiterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [stats, setStats] = useState({
    total_proposed: 0,
    meeting_completed: 0,
    contract_completed: 0,
    total_amount: 0
  });

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year, month });

      const response = await fetch(`/api/recruiter-performance?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('섭외자 실적 조회 실패:', error);
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
          <UserPlus className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold">섭외자 개인별 실적</h1>
        </div>
        <p className="text-gray-600">섭외자들의 실적을 확인하세요</p>
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
          <div className="text-sm text-gray-600 mb-1">총 섭외 건수</div>
          <div className="text-3xl font-bold">{stats.total_proposed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">미팅 완료</div>
          <div className="text-3xl font-bold text-blue-600">{stats.meeting_completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">계약 완료</div>
          <div className="text-3xl font-bold text-green-600">{stats.contract_completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">총 기장료</div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_amount)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">섭외자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 섭외</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">미팅 완료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약 완료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 기장료</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">성공률</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">로딩 중...</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">데이터가 없습니다.</td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{row.proposer}</td>
                  <td className="px-6 py-4 text-sm">{row.total_proposed}</td>
                  <td className="px-6 py-4 text-sm">{row.meeting_completed}</td>
                  <td className="px-6 py-4 text-sm">{row.contract_completed}</td>
                  <td className="px-6 py-4 text-sm">{formatCurrency(row.total_amount)}</td>
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

export default RecruiterPerformance;

