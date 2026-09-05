import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DepartmentCard from '../../components/department/DepartmentCard.jsx';
import DepartmentForm from '../../components/department/DepartmentForm.jsx';
import DepartmentHierarchy from '../../components/department/DepartmentHierarchy.jsx';
import departmentApi from '../../services/departmentApi.js';
import employeeApi from '../../services/employeeApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table' | 'hierarchy'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, hierRes, empRes] = await Promise.allSettled([
        departmentApi.getDepartments(),
        departmentApi.getDepartmentHierarchy(),
        employeeApi.getEmployees({ limit: 150 }),
      ]);

      if (deptRes.status === 'fulfilled') {
        const list = deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
        setDepartments(list);
      } else {
        setError(extractErrorMessage(deptRes.reason, 'Failed to load departments.'));
      }

      if (hierRes.status === 'fulfilled') {
        setHierarchy(hierRes.value.data || hierRes.value);
      }

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [deptRes, hierRes, empRes] = await Promise.allSettled([
          departmentApi.getDepartments(),
          departmentApi.getDepartmentHierarchy(),
          employeeApi.getEmployees({ limit: 150 }),
        ]);

        if (!active) return;

        if (deptRes.status === 'fulfilled') {
          const list = deptRes.value.data || (Array.isArray(deptRes.value) ? deptRes.value : []);
          setDepartments(list);
        } else {
          setError(extractErrorMessage(deptRes.reason, 'Failed to load departments.'));
        }

        if (hierRes.status === 'fulfilled') {
          setHierarchy(hierRes.value.data || hierRes.value);
        }

        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value.data || []);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDepartment(dept);
    setIsModalOpen(true);
  };

  const handleSave = async (deptData) => {
    try {
      if (editingDepartment) {
        await departmentApi.updateDepartment(editingDepartment.id, deptData);
        setStatusBanner({ type: 'success', text: 'Department updated successfully.' });
      } else {
        await departmentApi.createDepartment(deptData);
        setStatusBanner({ type: 'success', text: 'New department created successfully.' });
      }
      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to save department.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentApi.deleteDepartment(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      setStatusBanner({ type: 'success', text: 'Department deleted successfully.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to delete department.') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Departments'
        subtitle='Organizational business units, manager hierarchies, and headcount budgets.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Add Department</span>
          </button>
        }
      />

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type='button'
            onClick={() => setStatusBanner(null)}
            className='font-bold ml-2 cursor-pointer'
          >
            ✕
          </button>
        </div>
      )}

      {/* View Mode Switcher Toolbar */}
      <div className='flex items-center justify-between bg-white p-2.5 rounded-2xl border border-[#EAE6DF] shadow-2xs'>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-[#FAF8F5]'
            }`}
          >
            <span>🗂️</span>
            <span>Cards Grid</span>
          </button>

          <button
            type='button'
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-[#FAF8F5]'
            }`}
          >
            <span>📋</span>
            <span>Table List</span>
          </button>

          <button
            type='button'
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'hierarchy'
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-[#FAF8F5]'
            }`}
          >
            <span>🌳</span>
            <span>Org Hierarchy</span>
          </button>
        </div>

        <span className='text-xs font-bold text-gray-500 pr-2'>
          {departments.length} Departments
        </span>
      </div>

      {loading ? (
        <LoadingState message='Loading organizational departments...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : departments.length === 0 ? (
        <EmptyState
          title='No departments yet'
          description='Get started by creating your first organizational department.'
          actionLabel='+ Add Department'
          onAction={handleOpenAdd}
        />
      ) : viewMode === 'cards' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onEdit={handleOpenEdit}
              onDelete={() => setDeleteTarget(dept)}
            />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Department Name</th>
                  <th className='py-3 px-4'>Code</th>
                  <th className='py-3 px-4'>Manager</th>
                  <th className='py-3 px-4'>Parent Unit</th>
                  <th className='py-3 px-4'>Headcount</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {departments.map((dept) => {
                  const managerName = dept.manager?.firstName
                    ? `${dept.manager.firstName} ${dept.manager.lastName || ''}`.trim()
                    : typeof dept.manager === 'string'
                    ? dept.manager
                    : 'Unassigned';
                  const count = dept.employeeCount ?? dept.headCount ?? 0;

                  return (
                    <tr key={dept.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                      <td className='py-3 px-4 font-bold text-gray-900'>{dept.name}</td>
                      <td className='py-3 px-4 font-mono font-bold text-[#714B67]'>{dept.code}</td>
                      <td className='py-3 px-4 text-gray-700'>{managerName}</td>
                      <td className='py-3 px-4 text-gray-500'>
                        {dept.parentDepartment?.name || '--'}
                      </td>
                      <td className='py-3 px-4 font-bold text-gray-800'>
                        {count} {count === 1 ? 'staff' : 'staff'}
                      </td>
                      <td className='py-3 px-4 text-right space-x-2'>
                        <button
                          type='button'
                          onClick={() => handleOpenEdit(dept)}
                          className='text-[#714B67] hover:underline font-bold cursor-pointer'
                        >
                          Edit
                        </button>
                        <button
                          type='button'
                          onClick={() => setDeleteTarget(dept)}
                          className='text-rose-600 hover:underline font-bold cursor-pointer'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <DepartmentHierarchy hierarchy={hierarchy} departments={departments} />
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <DepartmentForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingDepartment}
          employees={employees}
          departments={departments}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title='Delete Department'
          message={`Are you sure you want to delete the "${deleteTarget.name}" department?`}
          confirmLabel='Delete'
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
