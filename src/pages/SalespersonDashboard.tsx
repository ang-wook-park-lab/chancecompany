import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, FileText, Plus, X, Edit2, Trash2, Check } from 'lucide-react';

interface Schedule {
  id?: number;
  user_id: number;
  title: string;
  schedule_date: string;
  schedule_time: string;
  client_name: string;
  location: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

interface Memo {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

const SalespersonDashboard: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  
  const [scheduleForm, setScheduleForm] = useState<Schedule>({
    user_id: user?.id || 0,
    title: '',
    schedule_date: '',
    schedule_time: '',
    client_name: '',
    location: '',
    notes: '',
    status: 'scheduled'
  });

  const [memoForm, setMemoForm] = useState<Memo>({
    user_id: user?.id || 0,
    title: '',
    content: '',
    category: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadSchedules();
      loadMemos();
    }
  }, [user]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`/api/schedules?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error('일정 조회 실패:', error);
    }
  };

  const loadMemos = async () => {
    try {
      const response = await fetch(`/api/memos?user_id=${user?.id}`);
      const result = await response.json();
      if (result.success) {
        setMemos(result.data);
      }
    } catch (error) {
      console.error('메모 조회 실패:', error);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSchedule ? `/api/schedules/${editingSchedule.id}` : '/api/schedules';
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleForm)
      });
      
      const result = await response.json();
      if (result.success) {
        await loadSchedules();
        setShowScheduleModal(false);
        resetScheduleForm();
      }
    } catch (error) {
      console.error('일정 저장 실패:', error);
    }
  };

  const handleMemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingMemo ? `/api/memos/${editingMemo.id}` : '/api/memos';
      const method = editingMemo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoForm)
      });
      
      const result = await response.json();
      if (result.success) {
        await loadMemos();
        setShowMemoModal(false);
        resetMemoForm();
      }
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error);
    }
  };

  const handleDeleteMemo = async (id: number) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/memos/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        await loadMemos();
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error);
    }
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm(schedule);
    setShowScheduleModal(true);
  };

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo);
    setMemoForm(memo);
    setShowMemoModal(true);
  };

  const handleCompleteSchedule = async (schedule: Schedule) => {
    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...schedule, status: 'completed' })
      });
      
      const result = await response.json();
      if (result.success) {
        await loadSchedules();
      }
    } catch (error) {
      console.error('일정 완료 처리 실패:', error);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      user_id: user?.id || 0,
      title: '',
      schedule_date: '',
      schedule_time: '',
      client_name: '',
      location: '',
      notes: '',
      status: 'scheduled'
    });
    setEditingSchedule(null);
  };

  const resetMemoForm = () => {
    setMemoForm({
      user_id: user?.id || 0,
      title: '',
      content: '',
      category: ''
    });
    setEditingMemo(null);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    const labels: Record<string, string> = {
      scheduled: '예정',
      completed: '완료',
      cancelled: '취소'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.scheduled}`}>
        {labels[status] || status}
      </span>
    );
  };

  // 최근 5개 일정만 표시
  const recentSchedules = schedules.slice(0, 5);
  // 최근 5개 메모만 표시
  const recentMemos = memos.slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          안녕하세요, {user?.name}님! 👋
        </h1>
        <p className="text-gray-600 mt-1">오늘도 좋은 하루 되세요!</p>
      </div>

      {/* 상단 카드 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 최근 일정 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-800">최근 일정</h3>
            </div>
            <button
              onClick={() => {
                resetScheduleForm();
                setShowScheduleModal(true);
              }}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {recentSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">등록된 일정이 없습니다</p>
              <p className="text-sm">+ 버튼을 눌러 일정을 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{schedule.title}</h4>
                        {getStatusBadge(schedule.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{schedule.schedule_date} {schedule.schedule_time}</span>
                        </div>
                        {schedule.client_name && (
                          <div>고객: {schedule.client_name}</div>
                        )}
                        {schedule.location && (
                          <div>장소: {schedule.location}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {schedule.status === 'scheduled' && (
                        <button
                          onClick={() => handleCompleteSchedule(schedule)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="완료"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메모 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">메모</h3>
            </div>
            <button
              onClick={() => {
                resetMemoForm();
                setShowMemoModal(true);
              }}
              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {recentMemos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-1">등록된 메모가 없습니다</p>
              <p className="text-sm">+ 버튼을 눌러 메모를 추가하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMemos.map((memo) => (
                <div
                  key={memo.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{memo.title}</h4>
                        {memo.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                            {memo.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{memo.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {memo.created_at ? new Date(memo.created_at).toLocaleString('ko-KR') : ''}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => handleEditMemo(memo)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMemo(memo.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 일정 추가/수정 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  resetScheduleForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일정 제목 *
                </label>
                <input
                  type="text"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 고객사 미팅"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 *
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.schedule_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시간
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.schedule_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객명
                </label>
                <input
                  type="text"
                  value={scheduleForm.client_name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, client_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: (주)찬스컴퍼니"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소
                </label>
                <input
                  type="text"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 서울시 강남구"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상세 내용을 입력하세요"
                />
              </div>

              {editingSchedule && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={scheduleForm.status}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">예정</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    resetScheduleForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  {editingSchedule ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 메모 추가/수정 모달 */}
      {showMemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMemo ? '메모 수정' : '메모 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowMemoModal(false);
                  resetMemoForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleMemoSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={memoForm.title}
                  onChange={(e) => setMemoForm({ ...memoForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="메모 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <input
                  type="text"
                  value={memoForm.category}
                  onChange={(e) => setMemoForm({ ...memoForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="예: 업무, 고객, 아이디어 등"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 *
                </label>
                <textarea
                  value={memoForm.content}
                  onChange={(e) => setMemoForm({ ...memoForm, content: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="메모 내용을 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemoModal(false);
                    resetMemoForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  {editingMemo ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonDashboard;

