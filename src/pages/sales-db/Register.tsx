import React, { useState, useEffect } from 'react';
import { Upload, Save, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  contract_date: string;
  contract_amount: string;
  contract_month: string;
  client_name: string;
  feedback: string;
  happycall_content: string;
  recruitment_record: string;
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
  contract_date: '',
  contract_amount: '',
  contract_month: '',
  client_name: '',
  feedback: '',
  happycall_content: '',
  recruitment_record: '',
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
      const validRows = rows.filter(row => row.company_name && row.company_name.trim() !== '');
      
      if (validRows.length === 0) {
        alert('저장할 데이터가 없습니다. 업체명은 필수 입력 항목입니다.');
        return;
      }

      const response = await fetch('/api/sales-db/bulk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${validRows.length}건의 데이터가 저장되었습니다.`);
        setRows([{ ...emptyRow }]);
      } else {
        alert('저장 실패: ' + result.message);
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        '섭외날짜': '2026-01-01',
        '섭외자': '예도모아',
        '영업자': '백상호',
        '미팅여부': '미팅완료',
        '업체명': '이룸',
        '대표자': '조나영',
        '주소': '부천 소사구 양주로 237 광장프라자',
        '연락처': '010-5085-0907',
        '업종': '온라인/도소매',
        '매출': '380000000',
        '기존거래처': '예송',
        '계약여부': 'Y',
        '제일월': '0',
        '실제매출': '100000',
        '계약날짜': '2026-01-12',
        '계약기장료': '500000',
        '계약월': '1월',
        '거래처': '예송 안세판매',
        '기타(피드백)': '계약 진행 중',
        '해피콜내용': '고객 만족',
        '섭외녹취': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    const colWidths = [
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
      { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DB등록샘플');
    XLSX.writeFile(wb, 'DB등록_샘플파일.xlsx');
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
        if (result.errors && result.errors.length > 0) {
          console.error('업로드 오류:', result.errors);
        }
        setRows([{ ...emptyRow }]);
      } else {
        alert('업로드 실패: ' + result.message);
      }
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Save className="w-6 h-6 mr-2" />
              📊 DB 등록
            </h1>
            <p className="text-gray-600 mt-1">고객 정보를 테이블 형태로 입력하세요</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={downloadSampleFile}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              샘플파일 다운로드
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? '업로드 중...' : 'CSV 업로드'}
              <input
                type="file"
                accept=".csv,.xlsx"
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
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외날짜</th>
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
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">제일월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">실제매출</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약날짜</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약기장료</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">계약월</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">거래처</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">기타(피드백)</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">해피콜내용</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">섭외녹취</th>
              <th className="border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
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
                  <select
                    value={row.meeting_status}
                    onChange={(e) => handleCellChange(index, 'meeting_status', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="미팅완료">미팅완료</option>
                    <option value="미팅대기">미팅대기</option>
                    <option value="미팅취소">미팅취소</option>
                  </select>
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
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
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
                  <select
                    value={row.contract_status}
                    onChange={(e) => handleCellChange(index, 'contract_status', e.target.value)}
                    className="w-16 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
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
                    type="date"
                    value={row.contract_date}
                    onChange={(e) => handleCellChange(index, 'contract_date', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    value={row.contract_amount}
                    onChange={(e) => handleCellChange(index, 'contract_amount', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                    placeholder="기장료"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.contract_month}
                    onChange={(e) => handleCellChange(index, 'contract_month', e.target.value)}
                    className="w-20 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                    placeholder="1월"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.client_name}
                    onChange={(e) => handleCellChange(index, 'client_name', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
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
                    type="text"
                    value={row.happycall_content}
                    onChange={(e) => handleCellChange(index, 'happycall_content', e.target.value)}
                    className="w-32 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="text"
                    value={row.recruitment_record}
                    onChange={(e) => handleCellChange(index, 'recruitment_record', e.target.value)}
                    className="w-24 px-1 py-1 text-sm border-0 focus:ring-1 focus:ring-blue-500"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <button
                    onClick={() => handleRemoveRow(index)}
                    disabled={rows.length === 1}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 disabled:bg-gray-300 inline-flex items-center gap-1"
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

      <div className="mt-4 text-sm text-gray-600">
        <p>💡 팁: CSV 또는 Excel 파일을 업로드하여 대량 등록할 수 있습니다.</p>
        <p>• 행 추가 버튼을 클릭하여 새로운 고객 정보를 입력하세요.</p>
        <p>• 업체명은 필수 입력 항목입니다.</p>
        <p>• 모든 데이터 입력 후 '전체 저장' 버튼을 클릭하세요.</p>
      </div>
    </div>
  );
};

export default SalesDBRegister;
