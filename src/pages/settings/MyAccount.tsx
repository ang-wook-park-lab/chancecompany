import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MyAccount: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.newPassword.length < 4) {
      alert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (!confirm('비밀번호를 변경하시겠습니까?')) return;

    try {
      setLoading(true);
      
      // 계정 변경 요청 등록
      const response = await fetch('/api/account-change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          request_type: 'password',
          current_value: '현재 비밀번호',
          new_value: formData.newPassword,
          reason: '비밀번호 변경 요청'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('비밀번호 변경 요청이 등록되었습니다. 관리자 승인을 기다려주세요.');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert('요청 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 요청 실패:', error);
      alert('요청 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInfoUpdate = async () => {
    if (!confirm('정보를 수정하시겠습니까?')) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('정보가 수정되었습니다.');
      } else {
        alert('정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('정보 수정 실패:', error);
      alert('정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">내 정보 수정</h1>
        </div>
        <p className="text-gray-600">개인 정보와 비밀번호를 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold">비밀번호 변경</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="현재 비밀번호 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="새 비밀번호 입력 (4자 이상)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="새 비밀번호 다시 입력"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              <Lock className="w-5 h-5" />
              비밀번호 변경 요청
            </button>
          </div>
        </div>

        {/* 개인 정보 수정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold">개인 정보</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="이름 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="이메일 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="연락처 입력"
              />
            </div>
            <button
              onClick={handleInfoUpdate}
              disabled={loading}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              정보 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;

