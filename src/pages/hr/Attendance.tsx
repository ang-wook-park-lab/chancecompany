import React, { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, CheckCircle, AlertCircle, Coffee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AttendanceRecord {
  date: string;
  dayOfWeek: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'vacation' | 'working';
  workHours: string;
}

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth] = useState('2024년 8월');
  
  // 샘플 데이터
  const workStats = {
    monthlyWorkHours: 130,
    totalWorkHours: 168,
    percentage: 75,
    remainingHours: 624,
    overtimeHours: 12,
  };

  const leaveStats = {
    totalDays: 10,
    usedDays: 7,
    percentage: 70.9,
    specialLeaves: [
      { type: '자녀', month: '3월' },
      { type: '조의', month: '3월' },
      { type: '휴가', month: '3월' },
    ],
  };

  const yearlyStats = {
    onTimeRate: 70,
    onTimeHours: 96.2,
    totalWorkHours: 312,
  };

  const weeklyRecords: AttendanceRecord[] = [
    { date: '8월 11일', dayOfWeek: '월', checkIn: '09:00', checkOut: '18:40', status: 'present', workHours: '9시간 40분' },
    { date: '8월 12일', dayOfWeek: '화', checkIn: '', checkOut: '', status: 'vacation', workHours: '휴가 미승인' },
    { date: '8월 13일', dayOfWeek: '수', checkIn: '08:50', checkOut: '진행중', status: 'working', workHours: '8시간 10분' },
    { date: '8월 14일', dayOfWeek: '목', checkIn: '', checkOut: '', status: 'absent', workHours: '개인적 일시' },
    { date: '8월 15일', dayOfWeek: '금', checkIn: '', checkOut: '', status: 'absent', workHours: '개인적 일시' },
  ];

  const recentRequests = [
    { date: '2024.08.26', title: '출퇴근 시간변경 신청', status: 'pending' },
    { date: '2024.08.26', title: '출퇴근 시간변경 신청', status: 'pending' },
    { date: '2024.08.24', title: '정정신청_연장근무', status: 'approved' },
    { date: '2024.08.24', title: '정정신청_연장근무', status: 'rejected' },
    { date: '2024.08.24', title: '연장신청_연장근무', status: 'rejected' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-blue-600 bg-blue-50';
      case 'working': return 'text-green-600 bg-green-50';
      case 'vacation': return 'text-yellow-600 bg-yellow-50';
      case 'absent': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">대기중</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">승인</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">반려</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">근태 요약</h1>
        <p className="text-gray-600 mt-2">{currentMonth} 근무 현황을 확인하세요</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 근태 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">근태 현황</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded">월간</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">주간</button>
            </div>
          </div>

          {/* 근무 시간 카드 */}
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white mb-4 shadow-lg">
            <div className="text-sm opacity-90 mb-2">근무 시간</div>
            <div className="flex items-baseline space-x-2 mb-1">
              <span className="text-4xl font-bold">{workStats.monthlyWorkHours}시간</span>
              <span className="text-lg opacity-80">/ {workStats.totalWorkHours}시간</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold">{workStats.percentage}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-white rounded-full h-2.5 shadow-sm transition-all duration-500" 
                  style={{ width: `${workStats.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">최대 근무 시간</span>
              <span className="text-sm font-semibold">{workStats.remainingHours}시간 남음</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">초과 시간</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-orange-600">{workStats.overtimeHours}시간</span>
                <span className="text-xs text-orange-600">(잔여휴가 이용 권장)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 연차 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">연차 현황</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">서비스 연차</span>
              <span className="text-lg font-bold text-green-600">{leaveStats.percentage}%</span>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-500 rounded-full h-3 transition-all duration-500" 
                  style={{ width: `${leaveStats.percentage}%` }}
                ></div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
              </div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-gray-800">{leaveStats.totalDays}일</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">특이사항</h3>
            <div className="flex justify-around">
              {leaveStats.specialLeaves.map((leave, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500">{leave.type}</div>
                  <div className="text-xs text-gray-500">{leave.month}</div>
                  <div className="text-sm font-semibold">{Math.floor(leaveStats.usedDays / 3)}월</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2024년 근무 상태 및 예측 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2024년 근무 상태 및 예측</h2>
          
          <div className="flex justify-center mb-4">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="15"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="15"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - yearlyStats.onTimeRate / 100)}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-600">정시 퇴근율</div>
                <div className="text-2xl font-bold text-blue-600">{yearlyStats.onTimeRate}%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">정시시간</div>
              <div className="text-xl font-bold text-gray-800">{yearlyStats.onTimeHours}시간</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">총 근무시간</div>
              <div className="text-xl font-bold text-gray-800">{yearlyStats.totalWorkHours}시간</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 이번주 근무 기록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">이번주 근무 기록</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>8월 3주</span>
              <span>8월 11일 - 8월 15일</span>
            </div>
          </div>

          <div className="space-y-2">
            {weeklyRecords.map((record, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                  record.status === 'present' ? 'border-blue-500 bg-blue-50' :
                  record.status === 'working' ? 'border-green-500 bg-green-50' :
                  record.status === 'vacation' ? 'border-yellow-500 bg-yellow-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">{record.date}</div>
                    <div className="font-semibold text-gray-700">({record.dayOfWeek})</div>
                  </div>
                  {record.status === 'present' || record.status === 'working' ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">근무 {record.workHours}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">{record.workHours}</div>
                  )}
                </div>
                {record.checkIn && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">출근: {record.checkIn}</div>
                    <div className="text-xs text-gray-500">
                      {record.checkOut === '진행중' ? (
                        <span className="text-green-600 font-semibold">진행중</span>
                      ) : (
                        `퇴근: ${record.checkOut}`
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 근무 신청 현황 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">근무 신청 현황</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청내역</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{request.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{request.title}</td>
                    <td className="px-4 py-3 text-center">
                      {getRequestStatusBadge(request.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

