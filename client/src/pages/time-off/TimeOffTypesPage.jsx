import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import TimeOffNavTabs from './TimeOffNavTabs.jsx';
import timeOffApi from '../../services/timeOffApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function TimeOffTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'DAYS',
    maxDaysPerYear: 12,
    isPaid: true,
    requiresApproval: true,
    requiresAllocation: true,
    description: '',
  });

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffApi.getTimeOffTypes();
      // FIX: Backend returns { success, data }
      const list = res?.data || [];
      setTypes(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load leave types.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      unit: 'DAYS',
      maxDaysPerYear: 12,
      isPaid: true,
      requiresApproval: true,
      requiresAllocation: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingType(t);
    setFormError(null);
    setFormData({
      name: t.name || '',
      code: t.code || '',
      unit: t.unit || 'DAYS',
      maxDaysPerYear: t.maxDaysPerYear || 12,
      isPaid: t.isPaid !== false,
      requiresApproval: t.requiresApproval !== false,
      requiresAllocation: t.requiresAllocation !== false,
      description: t.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Type name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Type code is required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      unit: formData.unit,
      maxDaysPerYear: Number(formData.maxDaysPerYear) || null,
      isPaid: Boolean(formData.isPaid),
      requiresApproval: Boolean(formData.requiresApproval),
      requiresAllocation: Boolean(formData.requiresAllocation),
      description: formData.description || null,
    };

    try {
      if (editingType) {
        await timeOffApi.updateTimeOffType(editingType.id, payload);
        setStatusBanner({ type: 'success', text: 'Leave type updated.' });
      } else {
        await timeOffApi.createTimeOffType(payload);
        setStatusBanner({ type: 'success', text: 'New leave type created.' });
      }
      setIsModalOpen(false);
      await loadTypes();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save leave type.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Leave Types Configuration'
        subtitle='Configure leave categories, accruals, and approval rules.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Leave Type
          </button>
        }
      />

      <TimeOffNavTabs />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading leave types...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTypes} />
      ) : types.length === 0 ? (
        <EmptyState title='No leave types configured' description='Create your first leave category.' actionLabel='+ New Leave Type' onAction={handleOpenAdd} />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {types.map((t) => (
            <div key={t.id} className='bg-white p-5 rounded-2xl border space-y-4'>
              <div className='flex items-start justify-between'>
                <div>
                  <h4 className='text-sm font-black'>{t.name}</h4>
                  <span className='text-[10px] font-bold text-[#714B67]'>CODE: {t.code}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  t.isPaid !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {t.isPaid !== false ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              <div className='text-xs text-gray-600 space-y-1.5'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Max Per Year:</span>
                  <strong>{t.maxDaysPerYear || '--'} {t.unit?.toLowerCase() || 'days'}</strong>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Requires Approval:</span>
                  <span>{t.requiresApproval !== false ? 'Yes' : 'No'}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Requires Allocation:</span>
                  <span>{t.requiresAllocation !== false ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className='flex justify-end pt-2 border-t'>
                <button type='button' onClick={() => handleOpenEdit(t)} className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 border shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b pb-2.5'>
              <h3 className='text-sm font-black'>{editingType ? 'Edit Leave Type' : 'New Leave Type'}</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div>
                <label className='block font-bold mb-1'>Type Name *</label>
                <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold mb-1'>Code *</label>
                  <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Unit *</label>
                  <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                    <option value='DAYS'>Days</option>
                    <option value='HOURS'>Hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Max Days Per Year</label>
                <input type='number' min='0' value={formData.maxDaysPerYear} onChange={(e) => setFormData({ ...formData, maxDaysPerYear: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='space-y-2'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' checked={formData.isPaid} onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })} className='rounded' />
                  <span className='font-bold'>Paid Leave</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' checked={formData.requiresApproval} onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })} className='rounded' />
                  <span className='font-bold'>Requires Approval</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input type='checkbox' checked={formData.requiresAllocation} onChange={(e) => setFormData({ ...formData, requiresAllocation: e.target.checked })} className='rounded' />
                  <span className='font-bold'>Requires Allocation</span>
                </label>
              </div>

              <div>
                <label className='block font-bold mb-1'>Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button type='submit' disabled={isSubmitting} className={`px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                  {isSubmitting ? 'Saving...' : 'Save Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}