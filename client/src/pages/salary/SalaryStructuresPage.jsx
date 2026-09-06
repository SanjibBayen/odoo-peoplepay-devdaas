import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingStructure, setEditingStructure] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    ruleIds: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [structRes, rulesRes] = await Promise.allSettled([
        salaryStructureApi.getSalaryStructures(),
        salaryRuleApi.getSalaryRules(),
      ]);

      if (structRes.status === 'fulfilled') {
        const list = structRes.value?.data || [];
        setStructures(Array.isArray(list) ? list : []);
      }
      if (rulesRes.status === 'fulfilled') {
        const rules = rulesRes.value?.data || [];
        setAvailableRules(Array.isArray(rules) ? rules : []);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load salary structures.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingStructure(null);
    setFormError(null);
    setFormData({
      name: '',
      code: `STR-${Date.now().toString().slice(-4)}`,
      description: '',
      ruleIds: availableRules.map((r) => r.id),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStructure(st);
    setFormError(null);
    const assignedIds = st?.rules ? st.rules.map((r) => r.id) : availableRules.map((r) => r.id);
    setFormData({
      name: st.name || '',
      code: st.code || '',
      description: st.description || '',
      ruleIds: assignedIds,
    });
    setIsModalOpen(true);
  };

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => ({
      ...prev,
      ruleIds: prev.ruleIds.includes(ruleId)
        ? prev.ruleIds.filter((rid) => rid !== ruleId)
        : [...prev.ruleIds, ruleId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingStructure) {
        await salaryStructureApi.updateSalaryStructure(editingStructure.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description || null,
        });
        setStatusBanner({ type: 'success', text: 'Salary structure updated.' });
      } else {
        await salaryStructureApi.createSalaryStructure({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description || null,
          ruleIds: formData.ruleIds,
        });
        setStatusBanner({ type: 'success', text: 'New salary structure created.' });
      }
      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save salary structure.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Salary Structures'
        subtitle='Define tiered pay structures and sequence calculations.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Structure
          </button>
        }
      />

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading salary structures...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : structures.length === 0 ? (
        <EmptyState title='No salary structures configured' description='Create a salary structure to group rules.' actionLabel='+ New Structure' onAction={handleOpenAdd} />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {structures.map((st) => {
            const ruleCount = st?.rules?.length || st?.ruleCount || 0;
            return (
              <div key={st.id} className='bg-white p-5 rounded-2xl border space-y-4'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='text-sm font-black'>{st.name}</h4>
                    <span className='text-[10px] font-bold text-[#714B67]'>CODE: {st.code}</span>
                  </div>
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border'>
                    {ruleCount} Rules
                  </span>
                </div>
                <p className='text-xs text-gray-500'>{st.description || 'Standard package.'}</p>
                <div className='flex items-center justify-between pt-2 border-t text-xs'>
                  <span>Status: <strong>{st.active !== false ? 'Active' : 'Archived'}</strong></span>
                  <button type='button' onClick={() => handleOpenEdit(st)} className='font-bold text-[#714B67] hover:underline cursor-pointer'>Configure</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-md w-full p-5 border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b pb-3'>
              <h3 className='text-sm font-black'>{editingStructure ? 'Configure Structure' : 'New Structure'}</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold mb-1'>Name *</label>
                  <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Code *</label>
                  <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='border-t pt-3 space-y-2'>
                <label className='block font-bold'>Assigned Rules ({formData.ruleIds.length})</label>
                <div className='max-h-48 overflow-y-auto space-y-1.5'>
                  {availableRules.map((rule) => {
                    const checked = formData.ruleIds.includes(rule.id);
                    return (
                      <div key={rule.id} onClick={() => handleToggleRule(rule.id)} className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer ${checked ? 'bg-[#FAF8F5] border-[#714B67]/40' : 'bg-gray-50 border-gray-100'}`}>
                        <div className='flex items-center gap-2'>
                          <input type='checkbox' checked={checked} onChange={() => {}} className='rounded' />
                          <span>{rule.name}</span>
                        </div>
                        <span className='font-mono text-[10px] text-[#714B67]'>{rule.code}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-4 py-1.5 font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl cursor-pointer'
                >
                  Cancel
                </button>
                <button type='submit' disabled={isSubmitting} className={`px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                  {isSubmitting ? 'Saving...' : 'Save Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}