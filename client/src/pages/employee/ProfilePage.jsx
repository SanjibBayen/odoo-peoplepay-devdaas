import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmployeeDetails from '../../components/employee/EmployeeDetails.jsx';
import ChangePasswordModal from '../../components/auth/ChangePasswordModal.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import { selectCurrentUser } from '../../redux/selectors/authSelectors.js';
import employeeApi from '../../services/employeeApi.js';
import authApi from '../../services/authApi.js';

function normalizeEmployee(emp) {
  if (!emp) return null;
  const firstName = emp.firstName || '';
  const lastName = emp.lastName || '';
  const fullName = emp.fullName || `${firstName} ${lastName}`.trim() || 'Employee';
  const code = emp.employeeCode || emp.employeeId || emp.id;
  const dept = emp.department?.name || emp.department || 'General';
  const pos = emp.jobPosition?.name || emp.jobPosition?.title || emp.jobPosition || 'Staff';
  const status =
    emp.status === 'ACTIVE'
      ? 'Active'
      : emp.status === 'ON_LEAVE'
        ? 'On Leave'
        : emp.status || 'Active';
  const contract = emp.contractStatus || 'Permanent';

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
    phone: emp.phone || '',
    avatar: firstName.charAt(0) || fullName.charAt(0) || 'E',
  };
}

export default function ProfilePage() {
  const currentUser = useSelector(selectCurrentUser);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [hrNotice, setHrNotice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from auth API (includes employee info)
        const authRes = await authApi.getMe();
        const authUser = authRes?.user || authRes?.data?.user || null;

        if (!authUser) {
          throw new Error('No user found');
        }

        // Check if user has employee record linked
        if (authUser.employee?.id) {
          try {
            const empRes = await employeeApi.getEmployeeById(authUser.employee.id);
            const empData = empRes?.data || empRes?.employee || null;

            if (isMounted && empData) {
              setProfile(
                normalizeEmployee({
                  ...empData,
                  ...authUser,
                  email: empData.email || authUser.email,
                  firstName: empData.firstName || authUser.firstName,
                  lastName: empData.lastName || authUser.lastName,
                })
              );
              setLoading(false);
              return;
            }
          } catch (empErr) {
            console.warn('Failed to fetch employee details, using auth user:', empErr.message);
          }
        }

        // Fallback: use auth user data directly
        if (isMounted) {
          setProfile(normalizeEmployee(authUser));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load profile');
          // Fallback to currentUser from Redux
          if (currentUser) {
            setProfile(normalizeEmployee(currentUser));
          }
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const currentEmployee = profile || {
    id: currentUser?.id || 'emp-current',
    employeeId: currentUser?.employeeCode || 'EMP-2024-001',
    name: currentUser
      ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      : 'Employee Profile',
    email: currentUser?.email || 'user@peoplepay.internal',
    phone: currentUser?.phone || '--',
    department: 'General',
    jobPosition: 'Staff',
    status: 'Active',
    contractStatus: 'Permanent',
    avatar: currentUser?.firstName?.charAt(0) || 'E',
  };

  if (loading) {
    return <LoadingState message='Loading employee profile...' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='My Profile'
        subtitle='Self-service personal identity, contact credentials, and employment details.'
        actions={
          <button
            type='button'
            onClick={() => setChangePasswordOpen(true)}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] shadow-xs transition-colors cursor-pointer'
          >
            <svg
              className='w-3.5 h-3.5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              strokeWidth='2'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
              />
            </svg>
            <span>Change Password</span>
          </button>
        }
      />

      {hrNotice && (
        <div className='p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-fadeIn'>
          <span>{hrNotice}</span>
          <button
            type='button'
            onClick={() => setHrNotice(null)}
            className='text-blue-700 font-bold ml-2 cursor-pointer'
          >
            ✕
          </button>
        </div>
      )}

      {error && !profile && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs'>
          {error}
        </div>
      )}

      <EmployeeDetails
        employee={currentEmployee}
        onBack={() => window.history.back()}
        onEdit={() => {
          setHrNotice(
            'To update official employment records or bank details, please contact your assigned HR Manager.'
          );
          setTimeout(() => setHrNotice(null), 6000);
        }}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}