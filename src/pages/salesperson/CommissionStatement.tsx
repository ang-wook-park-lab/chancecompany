import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Salesperson {
  id: number;
  name: string;
}

interface CommissionDetail {
  id: number;
  contract_date: string;
  company_name: string;
  contract_amount: number;
  commission_rate: number;
  commission_amount: number;
}

interface OtherCommission {
  id?: number;
  description: string;
  amount: number;
}

const SalespersonCommissionStatement: React.FC = () => {
  const { user } = useAuth();
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [details, setDetails] = useState<CommissionDetail[]>([]);
  const [otherCommissions, setOtherCommissions] = useState<OtherCommission[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');
  const [showOtherCommissionModal, setShowOtherCommissionModal] = useState(false);
  const [newOtherCommission, setNewOtherCommission] = useState({ description: '', amount: 0 });

  useEffect(() => {
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (selectedSalesperson) {
      fetchCommissionDetails();
    }
  }, [selectedSalesperson, year, month]);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
        
        if (user?.role === 'salesperson' && user?.id) {
          setSelectedSalesperson(user.id.toString());
        } else if (result.data.length > 0) {
          setSelectedSalesperson(result.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const fetchCommissionDetails = async () => {
    if (!selectedSalesperson) return;
    
    try {
      const response = await fetch(`/api/salesperson/${selectedSalesperson}/commission-details?year=${year}&month=${month}`);
      const result = await response.json();
      if (result.success) {
        setDetails(result.data || []);
        setOtherCommissions(result.otherCommissions || []);
      }
    } catch (error) {
      console.error('수수료 상세 조회 실패:', error);
    }
  };

  const contractCommission = details.reduce((sum, item) => sum + item.commission_amount, 0);
  const otherCommissionTotal = otherCommissions.reduce((sum, item) => sum + item.amount, 0);
  const totalCommission = contractCommission + otherCommissionTotal;
  const withholdingTax = Math.round(totalCommission * 0.033);
  const netAmount = totalCommission - withholdingTax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const handleEdit = (id: number, currentRate: number) => {
    setEditingId(id);
    setEditingRate(currentRate.toString());
  };

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/sales-db/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commission_rate: parseFloat(editingRate) || 500,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEditingId(null);
        fetchCommissionDetails();
      }
    } catch (error) {
      console.error('수수료율 저장 실패:', error);
      alert('수수료율 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRate('');
  };

  const handleAddOtherCommission = () => {
    if (!newOtherCommission.description || newOtherCommission.amount <= 0) {
      alert('설명과 금액을 입력하세요.');
      return;
    }
    
    setOtherCommissions([...otherCommissions, { ...newOtherCommission }]);
    setNewOtherCommission({ description: '', amount: 0 });
    setShowOtherCommissionModal(false);
  };

  const handleRemoveOtherCommission = (index: number) => {
    setOtherCommissions(otherCommissions.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!confirm('이 수수료 명세서를 확정하시겠습니까?')) return;
    
    try {
      const response = await fetch('/api/commission-statement/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesperson_id: selectedSalesperson,
          year,
          month,
          contract_commission: contractCommission,
          other_commissions: otherCommissions,
          total_commission: totalCommission,
          withholding_tax: withholdingTax,
          net_amount: netAmount,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('수수료 명세서가 확정되었습니다.');
      }
    } catch (error) {
      console.error('수수료 확정 실패:', error);
      alert('수수료 확정 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          영업자 수수료 명세서
        </h1>
        <p className="text-gray-600 mt-1">계약 완료된 업체별 수수료를 확인하세요 (계약여부='Y'인 항목만 표시)</p>
      </div>

      {/* 필터 및 선택 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">영업자:</label>
          <select
            value={selectedSalesperson}
            onChange={(e) => setSelectedSalesperson(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={user?.role === 'salesperson'}
          >
            <option value="">선택하세요</option>
            {salespersons.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-700 ml-4">년도:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 11 }, (_, i) => 2021 + i).map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-700">월:</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>

          <button
            onClick={handleConfirm}
            className="ml-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            확정
          </button>
        </div>
      </div>

      {/* 계약 수수료 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">계약일자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">업체명</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">계약기장료</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">수수료율 (%)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">수수료</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {details.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {selectedSalesperson ? '계약 완료된 데이터가 없습니다.' : '영업자를 선택하세요.'}
                </td>
              </tr>
            ) : (
              details.map((detail) => (
                <tr key={detail.id}>
                  <td className="px-6 py-4 text-sm">{formatDate(detail.contract_date)}</td>
                  <td className="px-6 py-4 text-sm font-medium">{detail.company_name}</td>
                  <td className="px-6 py-4 text-sm text-right">{formatCurrency(detail.contract_amount)}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    {editingId === detail.id ? (
                      <input
                        type="number"
                        value={editingRate}
                        onChange={(e) => setEditingRate(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        autoFocus
                      />
                    ) : (
                      `${detail.commission_rate}%`
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600">
                    {formatCurrency(detail.commission_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {editingId === detail.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSave(detail.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(detail.id, detail.commission_rate)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 기타수수료 섹션 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">기타수수료</h3>
          <button
            onClick={() => setShowOtherCommissionModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            추가
          </button>
        </div>
        {otherCommissions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">기타수수료가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {otherCommissions.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b py-2">
                <span className="text-sm">{item.description}</span>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatCurrency(item.amount)}원</span>
                  <button
                    onClick={() => handleRemoveOtherCommission(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 수수료 합계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-lg font-semibold">계약 수수료</span>
            <span className="text-lg">{formatCurrency(contractCommission)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 py-2">
            <span>기타 수수료</span>
            <span>+{otherCommissionTotal}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-lg font-bold py-2">
            <span>총 수수료</span>
            <span>{formatCurrency(totalCommission)}</span>
          </div>
          <div className="flex justify-between text-sm text-red-600 py-2">
            <span>원천징수 (3.3%)</span>
            <span>-{formatCurrency(withholdingTax)}</span>
          </div>
          <div className="border-t-2 border-gray-800 pt-3 flex justify-between text-xl font-bold text-green-600 py-2">
            <span>실수령액</span>
            <span>{formatCurrency(netAmount)}</span>
          </div>
        </div>
      </div>

      {/* 기타수수료 추가 모달 */}
      {showOtherCommissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">기타수수료 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={newOtherCommission.description}
                  onChange={(e) => setNewOtherCommission({ ...newOtherCommission, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="예: 추가 보너스"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
                <input
                  type="number"
                  value={newOtherCommission.amount}
                  onChange={(e) => setNewOtherCommission({ ...newOtherCommission, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowOtherCommissionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddOtherCommission}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalespersonCommissionStatement;

