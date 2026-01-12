import React, { useState, useEffect } from 'react';
import { Phone, Search, Filter, AlertCircle } from 'lucide-react';
import { HappyCall } from '../../types';

const HappyCallList: React.FC = () => {
  const [happyCalls, setHappyCalls] = useState<HappyCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [satisfactionFilter, setSatisfactionFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    상: 0,
    중: 0,
    하: 0
  });

  useEffect(() => {
    fetchHappyCalls();
    fetchStats();
  }, [satisfactionFilter, searchTerm]);

  const fetchHappyCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (satisfactionFilter !== '전체') {
        params.append('satisfaction_level', satisfactionFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/happy-calls?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setHappyCalls(data.data);
      }
    } catch (error) {
      console.error('해피콜 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/happy-calls/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const getSatisfactionEmoji = (level: string) => {
    switch (level) {
      case '상': return '😊';
      case '중': return '😐';
      case '하': return '😞';
      default: return '';
    }
  };

  const getSatisfactionColor = (level: string) => {
    switch (level) {
      case '상': return 'bg-green-100 text-green-800';
      case '중': return 'bg-yellow-100 text-yellow-800';
      case '하': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Phone className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">해피콜 관리</h1>
        </div>
        <p className="text-gray-600">고객 해피콜 내역을 확인하고 관리하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">전체</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">상 😊</div>
          <div className="text-2xl font-bold text-green-600">{stats.상}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">중 😐</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.중}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">하 😞</div>
          <div className="text-2xl font-bold text-red-600">{stats.하}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={satisfactionFilter}
              onChange={(e) => setSatisfactionFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="전체">전체</option>
              <option value="상">상</option>
              <option value="중">중</option>
              <option value="하">하</option>
            </select>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="고객명, 영업자, 담당자 검색"
              className="flex-1 border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Happy Calls List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : happyCalls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 해피콜 내역이 없습니다.
          </div>
        ) : (
          happyCalls.map((call) => (
            <div key={call.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{call.client_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSatisfactionColor(call.satisfaction_level)}`}>
                      {getSatisfactionEmoji(call.satisfaction_level)} {call.satisfaction_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {call.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {call.phone}
                      </div>
                    )}
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      📅 {call.call_date}
                    </div>
                  </div>
                </div>
              </div>

              {call.content && (
                <p className="text-gray-700 mb-3">{call.content}</p>
              )}

              {call.handler && (
                <div className="text-sm text-gray-600">
                  👤 담당자: {call.handler}
                </div>
              )}

              {call.satisfaction_level === '하' && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-red-900 mb-1">고객 불만 발생</div>
                      <div className="text-sm text-red-700">
                        관리자와 담당 영업자에게 알림이 전송되었습니다.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HappyCallList;

