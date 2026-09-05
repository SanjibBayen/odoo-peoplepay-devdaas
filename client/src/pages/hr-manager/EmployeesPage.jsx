import React, { useEffect, useMemo, useState } from 'react';
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

// Normalizer to adapt backend Employee record to frontend UI shape
function normalizeEmployee(emp) {
  if (!emp) return null;
  const firstName = emp.firstName || '';
  const lastName = emp.lastName || '';
  const fullName = emp.name || `${firstName} ${lastName}`.trim() || 'Unnamed';
  const code = emp.employeeCode || emp.employeeId || emp.id;
  const dept = emp.department?.name || emp.department || 'General';
  const pos = emp.jobPosition?.name || emp.jobPosition?.title || emp.jobPosition || 'Staff';
  const status = emp.status === 'ACTIVE' ? 'Active' : emp.status === 'ON_LEAVE' ? 'On Leave' : (emp.status || 'Active');
  const contract = emp.contracts?.[0]?.contractType || emp.contractStatus || 'Permanent';

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
    contractStatus: contract,
    email: emp.email || '',
    avatar: firstName.charAt(0) || fullName.charAt(0) || 'E',
  };
}

/**
 * Workforce Employee Management Page.
 * Accessible to HR Manager and Admin roles.
 * Connected directly to real backend API: /api/employees.
 */
export default function EmployeesPage() {
  const navigate = useNavigate();

  const [rawEmployees, setRawEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filter criteria state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedContract, setSelectedContract] = useState('All Contracts');

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await employeeApi.getEmployees({ limit: 100 });
      const items = res.data || [];
      setRawEmployees(items.map(normalizeEmployee));
    } catch (err) {
      setFetchError(extractErrorMessage(err, 'Failed to fetch workforce employees.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    employeeApi
      .getEmployees({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          const items = res.data || [];
          setRawEmployees(items.map(normalizeEmployee));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(extractErrorMessage(err, 'Failed to fetch workforce employees.'));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const employees = rawEmployees;

  // KPIs
  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;
  const departmentCount = new Set(employees.map((e) => e.department)).size;

  // Filtered employees memo
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search matching name, employee ID, email, or job position
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = emp.name?.toLowerCase().includes(query);
        const matchesId = emp.employeeId?.toLowerCase().includes(query);
        const matchesEmail = emp.email?.toLowerCase().includes(query);
        const matchesPosition = emp.jobPosition?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesEmail && !matchesPosition) {
          return false;
        }
      }

      // Department filter
      if (
        selectedDepartment !== 'All Departments' &&
        emp.department !== selectedDepartment
      ) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All Statuses' && emp.status !== selectedStatus) {
        return false;
      }

      // Contract filter
      if (
        selectedContract !== 'All Contracts' &&
        emp.contractStatus !== selectedContract
      ) {
        return false;
      }

      return true;
    });
  }, [
    employees,
    searchQuery,
    selectedDepartment,
    selectedStatus,
    selectedContract,
  ]);

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

  const handleSaveEmployee = async (formData) => {
    const isEdit = Boolean(editingEmployee);
    try {
      if (isEdit) {
        await employeeApi.updateEmployee(editingEmployee.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          departmentId: formData.departmentId,
          jobPositionId: formData.jobPositionId,
          status: formData.status === 'Active' ? 'ACTIVE' : formData.status === 'On Leave' ? 'ON_LEAVE' : formData.status,
          joiningDate: formData.joiningDate,
          address: formData.address,
        });
        setToastMessage(`Updated profile for ${formData.firstName} ${formData.lastName}.`);
      } else {
        await employeeApi.createEmployee({
          employeeCode: formData.employeeId || `EMP-${Date.now().toString().slice(-4)}`,
          firstName: formData.firstName,
          lastName: formData.lastName || '',
          email: formData.email,
          phone: formData.phone,
          joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
          departmentId: formData.departmentId || null,
          jobPositionId: formData.jobPositionId || null,
          address: formData.address,
        });
        setToastMessage(`Added new employee ${formData.firstName} ${formData.lastName}.`);
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err) {
      setToastMessage(extractErrorMessage(err, 'Failed to save employee profile.'));
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleViewEmployee = (emp) => {
    navigate(`/employees/${emp.id || emp.employeeId}`);
  };

  return (
    <div className='space-y-5'>
      {/* Page Header */}
      <PageHeader
        title='Employees'
        subtitle='Manage your workforce.'
        handwrittenNote='People ops in total sync'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5'
          >
            <span className='text-sm leading-none'>+</span>
            <span>Add Employee</span>
          </button>
        }
      />

      {/* KPI Stats Strip */}
      <section aria-labelledby='employees-stats-heading'>
        <h2 id='employees-stats-heading' className='sr-only'>
          Workforce Summary
        </h2>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          <StatCard
            label='Total Headcount'
            value={totalEmployeesCount}
            badgeText='Workforce'
            hint='Across all teams'
            iconType='users'
            bgColor='bg-blue-50/50'
            borderColor='border-blue-200/70'
            iconBg='bg-blue-100/90 text-blue-700'
            valueColor='text-blue-950'
          />
          <StatCard
            label='Active Employees'
            value={activeCount}
            badgeText='Online'
            hint='Currently active'
            iconType='user-check'
            bgColor='bg-emerald-50/50'
            borderColor='border-emerald-200/70'
            iconBg='bg-emerald-100/90 text-emerald-700'
            valueColor='text-emerald-950'
          />
          <StatCard
            label='On Leave'
            value={onLeaveCount}
            badgeText='Approved'
            hint='Planned leaves'
            iconType='calendar'
            bgColor='bg-amber-50/50'
            borderColor='border-amber-200/70'
            iconBg='bg-amber-100/90 text-amber-800'
            valueColor='text-amber-950'
          />
          <StatCard
            label='Departments'
            value={departmentCount}
            badgeText='Active'
            hint='Business units'
            iconType='building'
            bgColor='bg-purple-50/50'
            borderColor='border-purple-200/70'
            iconBg='bg-purple-100/90 text-[#714B67]'
            valueColor='text-purple-950'
          />
        </div>
      </section>

      {/* Filters Toolbar */}
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

      {loading && <LoadingState message='Loading employee directory from server...' />}
      {fetchError && <ErrorState message={fetchError} onRetry={fetchEmployees} />}

      {/* Employee Table */}
      {!loading && !fetchError && (
        <EmployeeTable
          employees={filteredEmployees}
          onView={handleViewEmployee}
          onEdit={handleOpenEdit}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Add / Edit Employee Modal Form */}
      {isFormOpen && (
        <EmployeeForm
          key={editingEmployee?.id || 'new'}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveEmployee}
          initialData={editingEmployee}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn'>
          <svg className='w-4 h-4 text-emerald-400 shrink-0' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
