import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';

interface PerformanceData {
  id: number;
  proposal_date: string;
  proposer: string;
  salesperson_name: string;
  company_name: string;
  representative: string;
  contact: string;
  meeting_status: string;
  contract_status: string;
  contract_client: string;
  actual_sales: number;
  commission_rate: number;
}

const MonthlyPerformance: React.FC = () => {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [contractStatus, setContractStatus] = useState('전체');
  const [clientFilter, setClientFilter] = useState('전체');
  const [stats, setStats] = useState({
    total: 0,
    contracted: 0,
    notContracted: 0,
    meetingCompleted: 0,
    totalAmount: 0,
    correctionCount: 0,
    correctionRefund: 0
  });

  useEffect(() => {
    fetchData();
  }, [year, month, contractStatus, clientFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ year, month });
      if (contractStatus !== '전체') params.append('contract_status', contractStatus);
      if (clientFilter !== '전체') params.append('client', clientFilter);

      const response = await fetch(`/api/monthly-performance?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('월별 실적 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">월별 실적 현황</h1>
            </div>
            <p className="text-gray-600">전체 영업 실적을 월별로 확인하고 관리합니다.</p>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="w-5 h-5" />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">조회 기간:</span>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 11 }, (_, i) => 2021 + i).map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-600">계약 상태:</span>
            <select
              value={contractStatus}
              onChange={(e) => setContractStatus(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="전체">전체</option>
              <option value="계약완료">계약 완료</option>
              <option value="미계약">미계약</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">전체 건수</div>
          <div className="text-xl font-bold">{stats.total}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">계약 완료</div>
          <div className="text-xl font-bold text-green-600">{stats.contracted}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">미계약</div>
          <div className="text-xl font-bold text-gray-600">{stats.notContracted}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">미팅 완료</div>
          <div className="text-xl font-bold text-blue-600">{stats.meetingCompleted}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">총 계약 기장료</div>
          <div className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">경정청구 건수</div>
          <div className="text-xl font-bold">{stats.correctionCount}건</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-600 mb-1">경정청구 환급액</div>
          <div className="text-lg font-bold text-orange-600">{formatCurrency(stats.correctionRefund)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">섭외 날짜</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">섭외자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">영업자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">미팅 상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약 상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출거래처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기장료</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수수료율</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-sm">{formatDate(row.proposal_date)}</td>
                  <td className="px-4 py-3 text-sm">{row.proposer || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.salesperson_name || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{row.company_name}</td>
                  <td className="px-4 py-3 text-sm">{row.representative || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.meeting_status ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {row.meeting_status}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.contract_status === '계약완료' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        계약완료
                      </span>
                    ) : row.contract_status === '미계약' ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        미계약
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.contract_client || '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.actual_sales ? formatCurrency(row.actual_sales) : '-'}</td>
                  <td className="px-4 py-3 text-sm">{row.commission_rate ? `${row.commission_rate}%` : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyPerformance;

