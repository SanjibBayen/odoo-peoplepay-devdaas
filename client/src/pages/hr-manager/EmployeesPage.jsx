import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import EmployeeFilters from '../../components/employee/EmployeeFilters.jsx';
import EmployeeForm from '../../components/employee/EmployeeForm.jsx';
import EmployeeTable from '../../components/employee/EmployeeTable.jsx';
import { getEmployees, saveEmployee } from '../../data/employeeStore.js';

/**
 * Workforce Employee Management Page.
 * Accessible to HR Manager and Admin roles.
 */
export default function EmployeesPage() {
  const navigate = useNavigate();

  // Local state initialized from persistent session store
  const [employees, setEmployees] = useState(() => getEmployees());

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
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleSaveEmployee = (savedData) => {
    const updated = saveEmployee(savedData);
    setEmployees(updated);
    setIsFormOpen(false);

    const isEdit = Boolean(editingEmployee);
    setToastMessage(
      isEdit
        ? `Updated profile for ${savedData.name}.`
        : `Added new employee ${savedData.name} (${savedData.employeeId}).`
    );

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleViewEmployee = (emp) => {
    navigate(`/employees/${emp.employeeId}`);
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

      {/* Employee Table */}
      <EmployeeTable
        employees={filteredEmployees}
        onView={handleViewEmployee}
        onEdit={handleOpenEdit}
        onResetFilters={handleResetFilters}
      />

      {/* Add / Edit Employee Modal Form */}
      <EmployeeForm
        key={editingEmployee?.id || 'new'}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className='fixed bottom-6 right-6 z-50 bg-[#1E293B] text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn'>
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
