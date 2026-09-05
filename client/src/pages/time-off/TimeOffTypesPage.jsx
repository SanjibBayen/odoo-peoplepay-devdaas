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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    daysAllowed: 12,
    isPaid: true,
    requiresApproval: true,
    description: '',
  });

  const loadTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffApi.getTimeOffTypes();
      const list = res.data || (Array.isArray(res) ? res : []);
      setTypes(list);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load leave types.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await timeOffApi.getTimeOffTypes();
        if (active) {
          const list = res.data || (Array.isArray(res) ? res : []);
          setTypes(list);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err, 'Failed to load leave types.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      daysAllowed: 12,
      isPaid: true,
      requiresApproval: true,
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
      daysAllowed: t.daysAllowed || 12,
      isPaid: t.isPaid !== false,
      requiresApproval: t.requiresApproval !== false,
      description: t.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      daysAllowed: Number(formData.daysAllowed),
      isPaid: Boolean(formData.isPaid),
      requiresApproval: Boolean(formData.requiresApproval),
      description: formData.description.trim(),
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
        subtitle='Configure statutory and discretionary leave categories, accruals, and approval rules.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>New Leave Type</span>
          </button>
        }
      />

      <TimeOffNavTabs />

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

      {loading ? (
        <LoadingState message='Loading leave types...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadTypes} />
      ) : types.length === 0 ? (
        <EmptyState
          title='No leave types configured'
          description='Create your first leave category (e.g. Paid Vacation, Sick Leave).'
          actionLabel='+ New Leave Type'
          onAction={handleOpenAdd}
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {types.map((t) => (
            <div
              key={t.id}
              className='bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-colors'
            >
              <div className='flex items-start justify-between'>
                <div>
                  <h4 className='text-sm font-black text-[#1E293B]'>{t.name}</h4>
                  <span className='text-[10px] font-bold text-[#714B67] tracking-wider'>
                    CODE: {t.code}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    t.isPaid !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {t.isPaid !== false ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              <div className='text-xs text-gray-600 space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400'>Annual Accrual:</span>
                  <strong className='text-gray-900'>{t.daysAllowed || '--'} days / year</strong>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400'>Requires Approval:</span>
                  <span className='font-semibold text-gray-800'>
                    {t.requiresApproval !== false ? 'Yes (Manager)' : 'Automatic'}
                  </span>
                </div>
                {t.description && (
                  <p className='text-[11px] text-gray-500 pt-1 border-t border-gray-100 line-clamp-2'>
                    {t.description}
                  </p>
                )}
              </div>

              <div className='flex justify-end pt-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => handleOpenEdit(t)}
                  className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
                >
                  Edit Configuration
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                {editingType ? 'Edit Leave Type' : 'New Leave Type'}
              </h3>
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
                <label className='block font-bold text-gray-700 mb-1'>Type Name *</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g. Sick Leave'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Code *</label>
                  <input
                    type='text'
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder='e.g. SL'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Days Allowed *</label>
                  <input
                    type='number'
                    required
                    min='0'
                    value={formData.daysAllowed}
                    onChange={(e) => setFormData({ ...formData, daysAllowed: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div className='space-y-2 pt-1'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className='rounded text-[#714B67] focus:ring-[#714B67]'
                  />
                  <span className='font-bold text-gray-800'>Paid Leave</span>
                </label>

                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.requiresApproval}
                    onChange={(e) =>
                      setFormData({ ...formData, requiresApproval: e.target.checked })
                    }
                    className='rounded text-[#714B67] focus:ring-[#714B67]'
                  />
                  <span className='font-bold text-gray-800'>Requires Manager Approval</span>
                </label>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Leave policy details'
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
