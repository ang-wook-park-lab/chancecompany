import React, { useState, useRef, useEffect } from 'react';
import { Users, Search, Plus, Edit, Trash2, Phone, Mail, Briefcase, X, Upload, Download } from 'lucide-react';
import { storageUtils, type CompanyLocation } from '../../lib/storage';
import * as XLSX from 'xlsx';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  hireDate: string;
  status: 'active' | 'inactive';
  username: string;
  password: string;
  totalLeave: number;    // 총 연차
  usedLeave: number;     // 사용한 연차
  remainingLeave: number; // 남은 연차
  workType?: '사무직' | '생산직' | '외근직'; // 근무 형태
  workLocation?: string; // 근무 장소
}

const Employees: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [companyLocations, setCompanyLocations] = useState<Array<{id: number, name: string}>>([]);
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    employeeCode: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    hireDate: '',
    status: 'active',
    username: '',
    password: '',
    totalLeave: 15,
    usedLeave: 0,
    remainingLeave: 15,
    workType: '사무직',
    workLocation: '회사 본사'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 회사 목록 불러오기
  useEffect(() => {
    const savedLocations = storageUtils.get<CompanyLocation[]>(storageUtils.keys.COMPANY_LOCATIONS);
    if (savedLocations) {
      try {
        setCompanyLocations(savedLocations.map((loc) => ({ id: loc.id, name: loc.name })));
        if (savedLocations.length > 0 && !formData.workLocation) {
          setFormData(prev => ({ ...prev, workLocation: savedLocations[0].name }));
        }
      } catch (error) {
        console.error('회사 목록 로드 실패:', error);
      }
    }
  }, []);
  
  // 샘플 데이터
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      name: '김철수',
      employeeCode: 'EMP001',
      department: '개발팀',
      position: '팀장',
      phone: '010-1234-5678',
      email: 'kim@company.com',
      hireDate: '2020.03.15',
      status: 'active',
      username: 'kimcs',
      password: 'emp123',
      totalLeave: 15,
      usedLeave: 3,
      remainingLeave: 12,
      workType: '사무직',
      workLocation: '회사 본사'
    },
    {
      id: 2,
      name: '이영희',
      employeeCode: 'EMP002',
      department: '디자인팀',
      position: '선임',
      phone: '010-2345-6789',
      email: 'lee@company.com',
      hireDate: '2021.06.01',
      status: 'active',
      username: 'leeyh',
      password: 'emp123',
      totalLeave: 15,
      usedLeave: 5,
      remainingLeave: 10,
      workType: '사무직',
      workLocation: '회사 본사'
    },
    {
      id: 3,
      name: '박민수',
      employeeCode: 'EMP003',
      department: '개발팀',
      position: '사원',
      phone: '010-3456-7890',
      email: 'park@company.com',
      hireDate: '2022.01.10',
      status: 'active',
      username: 'parkms',
      password: 'emp123',
      totalLeave: 15,
      usedLeave: 2,
      remainingLeave: 13,
      workType: '사무직',
      workLocation: '회사 본사'
    },
    {
      id: 4,
      name: '정수진',
      employeeCode: 'EMP004',
      department: '인사팀',
      position: '대리',
      phone: '010-4567-8901',
      email: 'jung@company.com',
      hireDate: '2019.11.20',
      status: 'active',
      username: 'jungsj',
      password: 'emp123',
      totalLeave: 15,
      usedLeave: 7,
      remainingLeave: 8,
      workType: '사무직',
      workLocation: '회사 본사'
    },
    {
      id: 5,
      name: '최동욱',
      employeeCode: 'EMP005',
      department: '영업팀',
      position: '과장',
      phone: '010-5678-9012',
      email: 'choi@company.com',
      hireDate: '2018.08.05',
      status: 'active',
      username: 'choidu',
      password: 'emp123',
      totalLeave: 15,
      usedLeave: 4,
      remainingLeave: 11,
      workType: '외근직',
      workLocation: '회사 본사'
    },
  ]);

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setIsEditing(true);
      setEditingId(employee.id);
      setFormData(employee);
    } else {
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        name: '',
        employeeCode: '',
        department: '',
        position: '',
        phone: '',
        email: '',
        hireDate: '',
        status: 'active',
        username: '',
        password: '',
        totalLeave: 15,
        usedLeave: 0,
        remainingLeave: 15
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      employeeCode: '',
      department: '',
      position: '',
      phone: '',
      email: '',
      hireDate: '',
      status: 'active',
      username: '',
      password: '',
      totalLeave: 15,
      usedLeave: 0,
      remainingLeave: 15
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingId) {
      // 수정
      const updatedEmployees = employees.map(emp => 
        emp.id === editingId ? { ...formData, id: editingId } as Employee : emp
      );
      setEmployees(updatedEmployees);
      
      // erp_users 업데이트
      const users = storageUtils.get<any[]>(storageUtils.keys.USERS) || [];
      const updatedUsers = users.map((user: any) => {
        if (user.id === editingId) {
          return {
            ...user,
            username: formData.username,
            name: formData.name,
            password: formData.password || user.password,
            role: 'employee',
            workType: formData.workType,
            workLocation: formData.workLocation
          };
        }
        return user;
      });
      storageUtils.set(storageUtils.keys.USERS, updatedUsers);
      console.log('[Employees] 사용자 정보 업데이트 완료');
    } else {
      // 추가
      const newId = Math.max(...employees.map(e => e.id), 0) + 1;
      const newEmployee: Employee = {
        ...formData,
        id: newId,
      } as Employee;
      setEmployees([...employees, newEmployee]);
      
      // erp_users에도 추가
      const users = storageUtils.get<any[]>(storageUtils.keys.USERS) || [];
      
      const newUser = {
        id: newId,
        username: formData.username,
        name: formData.name,
        role: 'employee',
        password: formData.password,
        workType: formData.workType,
        workLocation: formData.workLocation
      };
      
      users.push(newUser);
      storageUtils.set(storageUtils.keys.USERS, users);
      console.log('[Employees] 새 사용자 추가 완료:', newUser.username);
      
      alert('직원이 등록되었습니다. 로그인 아이디와 비밀번호가 생성되었습니다.');
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const handleInputChange = (field: keyof Employee, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const downloadSampleExcel = () => {
    const csvRows = [
      ['이름', '사번', '부서', '직급', '전화번호', '이메일', '입사일', '상태', '아이디', '비밀번호', '총연차', '사용연차', '남은연차'],
      ['홍길동', 'EMP006', '개발팀', '사원', '010-1111-2222', 'hong@company.com', '2024.01.15', 'active', 'honggd', 'emp123', '15', '0', '15'],
      ['김영희', 'EMP007', '디자인팀', '주임', '010-3333-4444', 'kim@company.com', '2024.02.01', 'active', 'kimyh', 'emp123', '15', '2', '13'],
      ['박철수', 'EMP008', '영업팀', '대리', '010-5555-6666', 'park@company.com', '2024.03.10', 'active', 'parkcs', 'emp123', '15', '3', '12'],
    ];
    
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\r\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '직원_샘플파일.csv';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split(/\r?\n/).filter(row => row.trim());
      
      if (rows.length <= 1) {
        alert('파일에 데이터가 없습니다.');
        return;
      }

      const newEmployees: Employee[] = [];
      const maxId = Math.max(...employees.map(emp => emp.id), 0);

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].split(',').map(cell => {
          let value = cell.trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          return value;
        });

        if (cells.length >= 13) {
          const newId = maxId + i;
          newEmployees.push({
            id: newId,
            name: cells[0],
            employeeCode: cells[1],
            department: cells[2],
            position: cells[3],
            phone: cells[4],
            email: cells[5],
            hireDate: cells[6],
            status: cells[7] === 'inactive' ? 'inactive' : 'active',
            username: cells[8],
            password: cells[9],
            totalLeave: Number(cells[10]) || 15,
            usedLeave: Number(cells[11]) || 0,
            remainingLeave: Number(cells[12]) || 15
          });
          
          // erp_users에도 추가
          const users = storageUtils.get<any[]>(storageUtils.keys.USERS) || [];
          users.push({
            id: newId,
            username: cells[8],
            name: cells[0],
            role: 'employee',
            password: cells[9],
            workType: cells[5] || '사무직',
            workLocation: cells[6] || '회사 본사'
          });
          storageUtils.set(storageUtils.keys.USERS, users);
        }
      }

      if (newEmployees.length > 0) {
        setEmployees([...employees, ...newEmployees]);
        alert(`${newEmployees.length}명의 직원이 추가되었습니다. 로그인 계정도 생성되었습니다.`);
      }
    };

    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.includes(searchTerm) ||
    emp.employeeCode.includes(searchTerm) ||
    emp.department.includes(searchTerm)
  );

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    departments: new Set(employees.map(e => e.department)).size,
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">재직</span>
      : <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">퇴사</span>;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">직원 목록</h1>
        <p className="text-gray-600 mt-2">직원 정보를 조회하고 관리하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">전체 직원</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}명</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">재직 중</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}명</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">부서 수</p>
              <p className="text-3xl font-bold text-purple-600">{stats.departments}개</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 사번, 부서로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={downloadSampleExcel}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              title="샘플 파일 다운로드"
            >
              <Download className="w-5 h-5" />
              <span>샘플 다운로드</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              title="엑셀 업로드"
            >
              <Upload className="w-5 h-5" />
              <span>엑셀 업로드</span>
            </button>
            
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>직원 등록</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직원정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  부서/직급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  근무형태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  근무장소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  입사일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {employee.name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500">{employee.employeeCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                    <div className="text-xs text-gray-500">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      employee.workType === '사무직' ? 'bg-blue-100 text-blue-800' :
                      employee.workType === '생산직' ? 'bg-green-100 text-green-800' :
                      employee.workType === '외근직' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {employee.workType || '사무직'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{employee.workLocation || '회사 본사'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.hireDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditing ? '직원 정보 수정' : '직원 등록'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="홍길동"
                    required
                  />
                </div>

                {/* 사번 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사번 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="EMP001"
                    required
                  />
                </div>

                {/* 부서 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    부서 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="개발팀"
                    required
                  />
                </div>

                {/* 직급 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직급 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="사원"
                    required
                  />
                </div>

                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="010-1234-5678"
                    required
                  />
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="example@company.com"
                    required
                  />
                </div>

                {/* 입사일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입사일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hireDate}
                    onChange={(e) => handleInputChange('hireDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="2024.01.01"
                    required
                  />
                </div>

                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="active">재직</option>
                    <option value="inactive">퇴사</option>
                  </select>
                </div>
              </div>

              {/* 로그인 정보 구분선 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">로그인 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 아이디 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      아이디 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="user123"
                      required
                    />
                  </div>

                  {/* 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      비밀번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="비밀번호 입력"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 연차 정보 구분선 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">연차 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 총 연차 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      총 연차 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.totalLeave}
                      onChange={(e) => {
                        const totalLeave = Number(e.target.value);
                        const usedLeave = formData.usedLeave || 0;
                        setFormData({
                          ...formData,
                          totalLeave,
                          remainingLeave: totalLeave - usedLeave
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="15"
                      min="0"
                      required
                    />
                  </div>

                  {/* 사용한 연차 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사용한 연차 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.usedLeave}
                      onChange={(e) => {
                        const usedLeave = Number(e.target.value);
                        const totalLeave = formData.totalLeave || 0;
                        setFormData({
                          ...formData,
                          usedLeave,
                          remainingLeave: totalLeave - usedLeave
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  {/* 남은 연차 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      남은 연차
                    </label>
                    <input
                      type="number"
                      value={formData.remainingLeave}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 총 연차와 사용한 연차를 입력하면 남은 연차가 자동으로 계산됩니다.
                </p>
              </div>

              {/* 근무 정보 구분선 */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">근무 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 근무 형태 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      근무 형태 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.workType}
                      onChange={(e) => handleInputChange('workType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="사무직">사무직</option>
                      <option value="생산직">생산직</option>
                      <option value="외근직">외근직</option>
                    </select>
                  </div>

                  {/* 근무 장소 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      근무 장소 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.workLocation}
                      onChange={(e) => handleInputChange('workLocation', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      {companyLocations.length > 0 ? (
                        companyLocations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))
                      ) : (
                        <option value="회사 본사">회사 본사</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 회사 설정 메뉴에서 회사 목록을 관리할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Excel Upload Info */}
              {!isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Upload className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">💡 다수의 직원을 한번에 등록하시려면?</p>
                      <p className="text-xs">위의 "샘플 다운로드" 버튼으로 샘플 파일을 다운로드하여 양식을 확인하고,<br />
                      "엑셀 업로드" 버튼으로 작성한 파일을 업로드하세요.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                >
                  {isEditing ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

