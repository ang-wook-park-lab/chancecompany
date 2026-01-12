import React, { useState, useEffect } from 'react';
import { Megaphone, Search, Plus, Pin } from 'lucide-react';
import { Notice } from '../../types';
import { useAuth } from '../../context/AuthContext';

const NoticeManagement: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotices();
  }, [searchTerm]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/notices?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold">공지사항 관리</h1>
            </div>
            <p className="text-gray-600">전체 직원에게 공지사항을 전달하세요</p>
          </div>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            새 공지사항
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="제목, 내용으로 검색..."
            className="flex-1 border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">등록된 공지사항이 없습니다.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className={`bg-white rounded-lg shadow p-6 ${notice.is_pinned ? 'border-2 border-orange-400' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {notice.is_pinned && <Pin className="w-5 h-5 text-orange-600" />}
                  <h3 className="text-xl font-bold">{notice.title}</h3>
                  {notice.is_important && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                      중요
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  조회 {notice.view_count}회
                </div>
              </div>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{notice.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>작성자: {notice.author_name}</span>
                <span>{formatDate(notice.created_at || '')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoticeManagement;

