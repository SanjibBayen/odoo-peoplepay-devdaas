import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import EmployeeFilters from '../../components/employee/EmployeeFilters.jsx';
import EmployeeForm from '../../components/employee/EmployeeForm.jsx';
import EmployeeTable from '../../components/employee/EmployeeTable.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizeEmployee(emp) {
  if (!emp) return null;
  const firstName = emp.firstName || '';
  const lastName = emp.lastName || '';
  const fullName = emp.fullName || `${firstName} ${lastName}`.trim() || 'Unnamed';
  const code = emp.employeeCode || emp.employeeId || emp.id;
  const dept = emp.department?.name || 'General';
  const pos = emp.jobPosition?.name || 'Staff';
  const status =
    emp.status === 'ACTIVE'
      ? 'Active'
      : emp.status === 'ON_LEAVE'
        ? 'On Leave'
        : emp.status === 'TERMINATED'
          ? 'Terminated'
          : emp.status || 'Active';

  return {
    ...emp,
    id: emp.id,
    firstName,
    lastName,
    name: fullName,
    employeeId: code,
    department: dept,
    departmentId: emp.departmentId,
    jobPosition: pos,
    jobPositionId: emp.jobPositionId,
    status,
    email: emp.email || '',
    avatar: firstName.charAt(0) || 'E',
  };
}

export default function EmployeesPage() {
  const navigate = useNavigate();

  const [rawEmployees, setRawEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedContract, setSelectedContract] = useState('All Contracts');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await employeeApi.getEmployees({ limit: 500 });
      
      
      const items = res?.employees || res?.data || [];
      
      setRawEmployees(Array.isArray(items) ? items.map(normalizeEmployee) : []);
    } catch (err) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch workforce employees.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const employees = rawEmployees;

  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const departmentCount = new Set(employees.map((e) => e.department)).size;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = emp.name?.toLowerCase().includes(query);
        const matchesId = emp.employeeId?.toLowerCase().includes(query);
        const matchesEmail = emp.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail) return false;
      }

      if (selectedDepartment !== 'All Departments' && emp.department !== selectedDepartment) {
        return false;
      }

      if (selectedStatus !== 'All Statuses' && emp.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedDepartment, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All Departments');
    setSelectedStatus('All Statuses');
    setSelectedContract('All Contracts');
  };

  const handleOpenAdd = () => {
    navigate('/admin/employees/add');
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleViewEmployee = (emp) => {
    navigate(`/employees/${emp.id}`);
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Employees'
        subtitle='Manage your workforce.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer flex items-center gap-1.5'
          >
            <span>+</span>
            <span>Add Employee</span>
          </button>
        }
      />

      {/* KPI Stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
        <StatCard label='Total Headcount' value={totalEmployeesCount} badgeText='Workforce' hint='Across all teams' iconType='users' bgColor='bg-blue-50/50' borderColor='border-blue-200/70' iconBg='bg-blue-100/90 text-blue-700' valueColor='text-blue-950' />
        <StatCard label='Active Employees' value={activeCount} badgeText='Online' hint='Currently active' iconType='user-check' bgColor='bg-emerald-50/50' borderColor='border-emerald-200/70' iconBg='bg-emerald-100/90 text-emerald-700' valueColor='text-emerald-950' />
        <StatCard label='On Leave' value={onLeaveCount} badgeText='Approved' hint='Planned leaves' iconType='calendar' bgColor='bg-amber-50/50' borderColor='border-amber-200/70' iconBg='bg-amber-100/90 text-amber-800' valueColor='text-amber-950' />
        <StatCard label='Departments' value={departmentCount} badgeText='Active' hint='Business units' iconType='building' bgColor='bg-purple-50/50' borderColor='border-purple-200/70' iconBg='bg-purple-100/90 text-[#714B67]' valueColor='text-purple-950' />
      </div>

      {/* Filters */}
      <EmployeeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedContract={selectedContract}
        onContractChange={setSelectedContract}
        onReset={handleResetFilters}
        totalCount={employees.length}
        filteredCount={filteredEmployees.length}
      />

      {loading && <LoadingState message='Loading employee directory...' />}
      {fetchError && <ErrorState message={fetchError} onRetry={fetchEmployees} />}

      {!loading && !fetchError && (
        <EmployeeTable
          employees={filteredEmployees}
          onView={handleViewEmployee}
          onEdit={handleOpenEdit}
          onResetFilters={handleResetFilters}
        />
      )}

      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white text-xs px-4 py-3 rounded-2xl shadow-xl animate-fadeIn'>
          {toastMessage}
        </div>
      )}
    </div>
  );
}