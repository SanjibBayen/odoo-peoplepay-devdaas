import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EmployeeDetails from '../../components/employee/EmployeeDetails.jsx';
import EmployeeForm from '../../components/employee/EmployeeForm.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizeEmployee(emp) {
  if (!emp) return null;
  const firstName = emp.firstName || '';
  const lastName = emp.lastName || '';
  const fullName = emp.fullName || `${firstName} ${lastName}`.trim() || 'Unnamed';
  const code = emp.employeeCode || emp.id;
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
    phone: emp.phone || '',
    avatar: firstName.charAt(0) || 'E',
  };
}

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchEmployee = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeById(employeeId);
      // FIX: Backend returns { success, employee } - use "employee" key
      const empData = res?.employee || res?.data || null;
      setEmployee(normalizeEmployee(empData));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee details.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleBack = () => navigate('/employees');

  const handleEdit = () => setIsEditOpen(true);

  const handleSave = async (savedData) => {
    try {
      await employeeApi.updateEmployee(employee.id, {
        firstName: savedData.firstName,
        lastName: savedData.lastName,
        email: savedData.email,
        phone: savedData.phone,
        departmentId: savedData.departmentId,
        jobPositionId: savedData.jobPositionId,
        status: savedData.status === 'Active' ? 'ACTIVE' : savedData.status,
        joiningDate: savedData.joiningDate,
        address: savedData.address,
      });
      setIsEditOpen(false);
      await fetchEmployee();
      setToastMessage('Employee profile updated successfully.');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setToastMessage(extractErrorMessage(err, 'Failed to update employee profile.'));
    }
  };

  if (loading) {
    return (
      <div className='py-12'>
        <LoadingState message='Loading employee profile...' />
      </div>
    );
  }

  const isNotFound = error?.toLowerCase().includes('not found') || !employee;

  if (error || !employee) {
    return (
      <div className='py-8 space-y-4 max-w-xl mx-auto'>
        <BackButton label='Back to Employees' fallback='/employees' onClick={handleBack} />
        <div className='bg-white rounded-3xl border border-[#EAE6DF] p-8 text-center space-y-4 shadow-2xs'>
          <div className='w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl'>
            🔍
          </div>
          <div>
            <h3 className='text-base font-bold text-[#1E293B]'>Employee Not Found</h3>
            <p className='text-xs text-gray-500 mt-1'>
              {error || 'The requested employee record does not exist or has been removed.'}
            </p>
          </div>
          <div className='pt-2 flex justify-center gap-3'>
            <button
              type='button'
              onClick={handleBack}
              className='px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] transition-colors cursor-pointer shadow-xs'
            >
              ← Back to Employees
            </button>
            {!isNotFound && (
              <button
                type='button'
                onClick={fetchEmployee}
                className='px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer'
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Employees' fallback='/employees' onClick={handleBack} />
        <Breadcrumbs items={[
          { label: 'Employees', to: '/employees' },
          { label: employee.name || 'Detail' },
        ]} />
      </div>

      <EmployeeDetails
        employee={employee}
        onBack={handleBack}
        onEdit={handleEdit}
      />

      {isEditOpen && (
        <EmployeeForm
          key={employee?.id || 'edit'}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave}
          initialData={employee}
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