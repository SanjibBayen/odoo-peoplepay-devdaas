import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import departmentApi from '../../services/departmentApi.js';
import { INITIAL_DEPARTMENTS } from '../../data/adminData.js';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(() => INITIAL_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager: '',
    budget: '₹50L',
  });

  const loadDepartments = () => {
    departmentApi
      .getDepartments()
      .then((res) => {
        setDepartments(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load departments');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await departmentApi.createDepartment(formData);
      setIsModalOpen(false);
      await loadDepartments();
    } catch (err) {
      alert(err.message || 'Failed to create department');
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
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {departments.map((dept) => (
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
                  {dept.headCount || 0} Members
                </span>
              </div>

              <div className='pt-2 border-t border-gray-100 text-xs space-y-1 text-gray-600'>
                <div>Manager: <strong className='text-gray-900'>{dept.manager || 'Unassigned'}</strong></div>
                <div>Monthly Budget: <strong className='text-gray-900'>{dept.budget || '--'}</strong></div>
              </div>
            </div>
          ))}
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
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Department Name *</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g. Data Science'
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
                  placeholder='e.g. DS'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Department Lead</label>
                <input
                  type='text'
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder='Lead Manager Name'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-3 py-1.5 font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-lg cursor-pointer'
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
