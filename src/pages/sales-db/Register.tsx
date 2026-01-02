import React, { useState, useEffect } from 'react';
import { Upload, Save, Plus, Trash2 } from 'lucide-react';

interface Salesperson {
  id: number;
  name: string;
}

interface SalesDBRow {
  id?: number;
  proposal_date: string;
  proposer: string;
  salesperson_id: string;
  meeting_status: string;
  company_name: string;
  representative: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: string;
  existing_client: string;
  contract_status: string;
  termination_month: string;
  actual_sales: string;
  contract_client: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  april_type1_date: string;
}

const emptyRow: SalesDBRow = {
  proposal_date: '',
  proposer: '',
  salesperson_id: '',
  meeting_status: '',
  company_name: '',
  representative: '',
  address: '',
  contact: '',
  industry: '',
  sales_amount: '',
  existing_client: '',
  contract_status: '',
  termination_month: '',
  actual_sales: '',
  contract_client: '',
  contract_month: '',
  client_name: '',
  feedback: '',
  april_type1_date: '',
};

const SalesDBRegister: React.FC = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [rows, setRows] = useState<SalesDBRow[]>([{ ...emptyRow }]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSalespersons();
  }, []);

  const fetchSalespersons = async () => {
    try {
      const response = await fetch('/api/salespersons');
      const result = await response.json();
      if (result.success) {
        setSalespersons(result.data);
      }
    } catch (error) {
      console.error('영업자 목록 조회 실패:', error);
    }
  };

  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  const handleCellChange = (index: number, field: keyof SalesDBRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSaveAll = async () => {
    try {
      for (const row of rows) {
        if (!row.company_name) continue; // 필수 필드 체크
        
        await fetch('/api/sales-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...row,
            salesperson_id: row.salesperson_id ? parseInt(row.salesperson_id) : null,
            sales_amount: row.sales_amount ? parseInt(row.sales_amount) : null,
            actual_sales: row.actual_sales ? parseInt(row.actual_sales) : null,
          }),
        });
      }
      alert('모든 데이터가 저장되었습니다.');
      setRows([{ ...emptyRow }]);
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/sales-db/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.success) {
        alert(`업로드 완료: ${result.successCount}개 데이터`);
        if (result.errors.length > 0) {
          console.error('업로드 오류:', result.errors);
        }
      } else {
        alert('업로드 실패: ' + result.message);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // 파일 입력 초기화
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Save className="w-6 h-6 mr-2" />
              DB 등록
            </h1>
            <p className="text-gray-600 mt-1">고객 정보를 테이블 형태로 입력하세요</p>
          </div>
          <div className="flex space-x-3">
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? '업로드 중...' : 'CSV 업로드'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              행 추가
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              전체 저장
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">작업</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외날자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">영업자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">미팅여부</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">업체명<span className="text-red-500">*</span></th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">대표자</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">주소</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">연락처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">업종</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">매출</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">기존거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약여부</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">해임월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">실제매출</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">기타(피드백)</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">해피콜내용</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                    title="행 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="date"
                    value={row.proposal_date}
                    onChange={(e) => handleCellChange(index, 'proposal_date', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.proposer}
                    onChange={(e) => handleCellChange(index, 'proposer', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <select
                    value={row.salesperson_id}
                    onChange={(e) => handleCellChange(index, 'salesperson_id', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {salespersons.map((sp) => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.meeting_status}
                    onChange={(e) => handleCellChange(index, 'meeting_status', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.company_name}
                    onChange={(e) => handleCellChange(index, 'company_name', e.target.value)}
                    required
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.representative}
                    onChange={(e) => handleCellChange(index, 'representative', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.address}
                    onChange={(e) => handleCellChange(index, 'address', e.target.value)}
                    className="w-48 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contact}
                    onChange={(e) => handleCellChange(index, 'contact', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.industry}
                    onChange={(e) => handleCellChange(index, 'industry', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    value={row.sales_amount}
                    onChange={(e) => handleCellChange(index, 'sales_amount', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.existing_client}
                    onChange={(e) => handleCellChange(index, 'existing_client', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_status}
                    onChange={(e) => handleCellChange(index, 'contract_status', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.termination_month}
                    onChange={(e) => handleCellChange(index, 'termination_month', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    value={row.actual_sales}
                    onChange={(e) => handleCellChange(index, 'actual_sales', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_client}
                    onChange={(e) => handleCellChange(index, 'contract_client', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_month}
                    onChange={(e) => handleCellChange(index, 'contract_month', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.client_name}
                    onChange={(e) => handleCellChange(index, 'client_name', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.feedback}
                    onChange={(e) => handleCellChange(index, 'feedback', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="date"
                    value={row.april_type1_date}
                    onChange={(e) => handleCellChange(index, 'april_type1_date', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• 업체명은 필수 입력 항목입니다.</p>
        <p>• CSV 파일 업로드 시 헤더는 한글 또는 영문을 사용할 수 있습니다.</p>
        <p>• 행을 추가하여 여러 건을 한 번에 입력할 수 있습니다.</p>
      </div>
    </div>
  );
};

export default SalesDBRegister;
