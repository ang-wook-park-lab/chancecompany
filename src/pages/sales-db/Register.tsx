import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload, Save, Trash2 } from 'lucide-react';

interface DBRow {
  id?: string;
  address: string;
  contact: string;
  industry: string;
  sales_amount: string;
  existing_client: string;
  contract_status: string;
  termination_count: string;
  actual_sales: string;
  contract_date: string;
  contract_period: string;
  contract_day: string;
  client_name: string;
  memo: string;
  backup_col: string;
  business_status: string;
}

const emptyRow: DBRow = {
  id: '',
  address: '',
  contact: '',
  industry: '',
  sales_amount: '',
  existing_client: '',
  contract_status: 'Y',
  termination_count: '',
  actual_sales: '',
  contract_date: '',
  contract_period: '',
  contract_day: '',
  client_name: '',
  memo: '',
  backup_col: '',
  business_status: ''
};

const SalesDBRegister: React.FC = () => {
  const [rows, setRows] = useState<DBRow[]>([{ ...emptyRow, id: Date.now().toString() }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRow = () => {
    setRows([...rows, { ...emptyRow, id: Date.now().toString() }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) {
      alert('최소 1개의 행은 필요합니다.');
      return;
    }
    setRows(rows.filter(row => row.id !== id));
  };

  const handleInputChange = (id: string, field: keyof DBRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSaveAll = async () => {
    try {
      setIsLoading(true);
      
      // 빈 행 제외
      const validRows = rows.filter(row => 
        row.address || row.contact || row.industry || row.sales_amount
      );

      if (validRows.length === 0) {
        alert('저장할 데이터가 없습니다.');
        return;
      }

      const response = await fetch('/api/sales-db/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${validRows.length}건의 데이터가 저장되었습니다.`);
        setRows([{ ...emptyRow, id: Date.now().toString() }]);
      } else {
        alert('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const csv = [
      '주소,연락처,업종,매출,기존거래처,계약여부,제일회수,실제매출,계약날짜,계약기간,계약일,거래처,기타(메모),예비컬럼,상업속성',
      '경기도 구리시,010-1234-5678,온라인/도소매,100000,예송,Y,100000,2026-01-12,0,예송,,,,'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'DB등록_샘플파일.csv';
    link.click();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const newRows = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          const values = line.split(',');
          return {
            id: `${Date.now()}_${index}`,
            address: values[0] || '',
            contact: values[1] || '',
            industry: values[2] || '',
            sales_amount: values[3] || '',
            existing_client: values[4] || '',
            contract_status: values[5] || 'Y',
            termination_count: values[6] || '',
            actual_sales: values[7] || '',
            contract_date: values[8] || '',
            contract_period: values[9] || '',
            contract_day: values[10] || '',
            client_name: values[11] || '',
            memo: values[12] || '',
            backup_col: values[13] || '',
            business_status: values[14] || ''
          };
        });

        setRows(newRows);
        alert(`${newRows.length}건의 데이터를 불러왔습니다.`);
      } catch (error) {
        console.error('CSV 파싱 실패:', error);
        alert('CSV 파일 읽기에 실패했습니다.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 DB 등록</h1>
            <p className="text-gray-600">고객 정보를 테이블 형태로 입력하세요</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadSample}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              샘플파일 다운로드
            </button>
            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 cursor-pointer">
              <Upload className="w-5 h-5" />
              CSV 업로드
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleAddRow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              행 추가
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isLoading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              전체 저장
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">주소</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">연락처</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">업종</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">매출</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">기존거래처</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">계약여부</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">제일회수</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">실제매출</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">계약날짜</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">계약기간</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">계약일</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">거래처</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">기타(메모박)</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">예비클날용</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">상업속자</th>
              <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.address}
                    onChange={(e) => handleInputChange(row.id!, 'address', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="주소"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.contact}
                    onChange={(e) => handleInputChange(row.id!, 'contact', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="010-0000-0000"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.industry}
                    onChange={(e) => handleInputChange(row.id!, 'industry', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="업종"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="number"
                    value={row.sales_amount}
                    onChange={(e) => handleInputChange(row.id!, 'sales_amount', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="0"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.existing_client}
                    onChange={(e) => handleInputChange(row.id!, 'existing_client', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="거래처"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <select
                    value={row.contract_status}
                    onChange={(e) => handleInputChange(row.id!, 'contract_status', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  >
                    <option value="Y">Y</option>
                    <option value="선택">선택</option>
                  </select>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="number"
                    value={row.termination_count}
                    onChange={(e) => handleInputChange(row.id!, 'termination_count', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="0"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="number"
                    value={row.actual_sales}
                    onChange={(e) => handleInputChange(row.id!, 'actual_sales', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="0"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="date"
                    value={row.contract_date}
                    onChange={(e) => handleInputChange(row.id!, 'contract_date', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.contract_period}
                    onChange={(e) => handleInputChange(row.id!, 'contract_period', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="0"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.contract_day}
                    onChange={(e) => handleInputChange(row.id!, 'contract_day', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="계약일"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.client_name}
                    onChange={(e) => handleInputChange(row.id!, 'client_name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="거래처"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.memo}
                    onChange={(e) => handleInputChange(row.id!, 'memo', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder="메모"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.backup_col}
                    onChange={(e) => handleInputChange(row.id!, 'backup_col', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <input
                    type="text"
                    value={row.business_status}
                    onChange={(e) => handleInputChange(row.id!, 'business_status', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    placeholder=""
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => handleRemoveRow(row.id!)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 inline-flex items-center gap-1"
                    title="행 삭제"
                  >
                    <span className="text-xs">☺</span> 폐쇄 생략
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>💡 팁: CSV 파일을 업로드하여 대량 등록할 수 있습니다.</p>
        <p>• 행 추가 버튼을 클릭하여 새로운 고객 정보를 입력하세요.</p>
        <p>• 모든 데이터 입력 후 '전체 저장' 버튼을 클릭하세요.</p>
      </div>
    </div>
  );
};

export default SalesDBRegister;
