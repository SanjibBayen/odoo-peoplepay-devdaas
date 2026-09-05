import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import departmentApi from '../../services/departmentApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const loadDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await departmentApi.getDepartments();
      const list = res.data || (Array.isArray(res) ? res : []);
      setDepartments(list);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await departmentApi.getDepartments();
        if (!active) return;
        const list = res.data || (Array.isArray(res) ? res : []);
        setDepartments(list);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load organizational departments.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await departmentApi.createDepartment({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
      });
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
      await loadDepartments();
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to create department.'));
    } finally {
      setIsSubmitting(false);
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
            onClick={() => setIsModalOpen(true)}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Add Department</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Loading organizational departments...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadDepartments} />
      ) : departments.length === 0 ? (
        <EmptyState
          title='No departments yet'
          description='Get started by creating your first organizational department.'
          actionLabel='+ Add Department'
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {departments.map((dept) => {
            const managerName = dept.manager?.firstName
              ? `${dept.manager.firstName} ${dept.manager.lastName || ''}`.trim()
              : typeof dept.manager === 'string'
              ? dept.manager
              : 'Unassigned';
            const count = dept.employeeCount ?? dept.headCount ?? 0;

            return (
              <div
                key={dept.id}
                className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-3'
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='text-sm font-black text-[#1E293B]'>{dept.name}</h4>
                    <span className='text-[10px] font-bold text-[#714B67]'>
                      CODE: {dept.code}
                    </span>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200'>
                    {count} Members
                  </span>
                </div>

                <div className='pt-2 border-t border-gray-100 text-xs space-y-1 text-gray-600'>
                  <div>
                    Manager: <strong className='text-gray-900'>{managerName}</strong>
                  </div>
                  {dept.description && (
                    <div className='text-[11px] text-gray-500 line-clamp-2'>
                      {dept.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Department Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>Add Department</h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium'>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Department Name *</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g. Engineering'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Code *</label>
                <input
                  type='text'
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder='e.g. ENG'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Department mission and responsibilities'
                  rows={2}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
