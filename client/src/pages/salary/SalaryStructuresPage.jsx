import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
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
    status: 'Active',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [structRes, rulesRes] = await Promise.allSettled([
        salaryStructureApi.getSalaryStructures(),
        salaryRuleApi.getSalaryRules(),
      ]);

      if (structRes.status === 'fulfilled') {
        const list = structRes.value.data || (Array.isArray(structRes.value) ? structRes.value : []);
        setStructures(list);
      }
      if (rulesRes.status === 'fulfilled') {
        const rules = rulesRes.value.data || (Array.isArray(rulesRes.value) ? rulesRes.value : []);
        setAvailableRules(rules);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load salary structures.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [structRes, rulesRes] = await Promise.allSettled([
          salaryStructureApi.getSalaryStructures(),
          salaryRuleApi.getSalaryRules(),
        ]);
        if (!active) return;
        if (structRes.status === 'fulfilled') {
          const list = structRes.value.data || (Array.isArray(structRes.value) ? structRes.value : []);
          setStructures(list);
        }
        if (rulesRes.status === 'fulfilled') {
          const rules = rulesRes.value.data || (Array.isArray(rulesRes.value) ? rulesRes.value : []);
          setAvailableRules(rules);
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load salary structures.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingStructure(null);
    setFormError(null);
    setFormData({
      name: '',
      code: `STR-${Date.now().toString().slice(-4)}`,
      description: '',
      ruleIds: availableRules.map((r) => r.id),
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st) => {
    setEditingStructure(st);
    setFormError(null);
    const assignedIds = st.rules ? st.rules.map((r) => r.id) : availableRules.map((r) => r.id);
    setFormData({
      name: st.name,
      code: st.code,
      description: st.description || '',
      ruleIds: assignedIds,
      status: st.active ? 'Active' : 'Archived',
    });
    setIsModalOpen(true);
  };

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => {
      const exists = prev.ruleIds.includes(ruleId);
      return {
        ...prev,
        ruleIds: exists
          ? prev.ruleIds.filter((id) => id !== ruleId)
          : [...prev.ruleIds, ruleId],
      };
    });
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
          description: formData.description,
        });
        setStatusBanner({ type: 'success', text: 'Salary structure updated.' });
      } else {
        await salaryStructureApi.createSalaryStructure({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description,
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
        subtitle='Define tiered pay structures and sequence calculations for salary components.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>New Structure</span>
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

      {loading ? (
        <LoadingState message='Loading salary structures...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : structures.length === 0 ? (
        <EmptyState
          title='No salary structures configured'
          description='Create a salary structure to group allowances, deductions, and tax calculation rules.'
          actionLabel='+ New Structure'
          onAction={handleOpenAdd}
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {structures.map((st) => {
            const ruleCount = st.rules?.length || st.rulesCount || availableRules.length || 0;
            return (
              <div
                key={st.id}
                className='bg-white p-5 rounded-2xl border border-[#EAE6DF] shadow-2xs space-y-4 hover:border-gray-300 transition-colors'
              >
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='text-sm font-black text-[#1E293B]'>{st.name}</h4>
                    <span className='text-[10px] font-bold text-[#714B67] tracking-wider'>
                      CODE: {st.code}
                    </span>
                  </div>
                  <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#714B67] border border-purple-200'>
                    {ruleCount} Rules
                  </span>
                </div>

                <p className='text-xs text-gray-500 line-clamp-2'>
                  {st.description || 'Standard corporate compensation package.'}
                </p>

                <div className='flex items-center justify-between pt-2 border-t border-gray-100 text-xs'>
                  <span className='text-gray-400 font-medium'>
                    Status: <strong className='text-gray-700'>{st.active !== false ? 'Active' : 'Archived'}</strong>
                  </span>
                  <button
                    type='button'
                    onClick={() => handleOpenEdit(st)}
                    className='font-bold text-[#714B67] hover:underline cursor-pointer'
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                {editingStructure ? 'Configure Salary Structure' : 'New Salary Structure'}
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

            <form onSubmit={handleSave} className='space-y-3.5 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Structure Name *</label>
                  <input
                    type='text'
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='e.g. Senior Engineering'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Structure Code *</label>
                  <input
                    type='text'
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder='e.g. ENG-SR'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Notes on who this structure applies to'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              {/* Linked Salary Rules */}
              <div className='border-t border-gray-100 pt-3 space-y-2'>
                <label className='block font-bold text-gray-700'>
                  Assigned Salary Rules ({formData.ruleIds.length})
                </label>
                <div className='max-h-48 overflow-y-auto space-y-1.5 pr-1'>
                  {availableRules.map((rule) => {
                    const checked = formData.ruleIds.includes(rule.id);
                    return (
                      <div
                        key={rule.id}
                        onClick={() => handleToggleRule(rule.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#FAF8F5] border-[#714B67]/40 text-gray-900 font-medium'
                            : 'bg-gray-50/50 border-gray-100 text-gray-400'
                        }`}
                      >
                        <div className='flex items-center gap-2'>
                          <input
                            type='checkbox'
                            checked={checked}
                            onChange={() => {}}
                            className='rounded text-[#714B67] focus:ring-[#714B67]'
                          />
                          <span>{rule.name}</span>
                        </div>
                        <span className='font-mono text-[10px] text-[#714B67] font-bold'>
                          {rule.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
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
