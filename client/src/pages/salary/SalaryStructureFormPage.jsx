import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function SalaryStructureFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [availableRules, setAvailableRules] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    ruleIds: [],
  });

  const loadStructureData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rulesRes = await salaryRuleApi.getSalaryRules();
      // FIX: Backend returns { success, data }
      const rules = rulesRes?.data || [];
      setAvailableRules(Array.isArray(rules) ? rules : []);

      if (isEdit) {
        const structRes = await salaryStructureApi.getSalaryStructureById(id);
        const st = structRes?.data || structRes;
        const assignedIds = st?.rules ? st.rules.map((r) => r.id) : rules.map((r) => r.id);
        setFormData({
          name: st?.name || '',
          code: st?.code || '',
          description: st?.description || '',
          ruleIds: assignedIds,
        });
      } else {
        setFormData({
          name: '',
          code: `STR-${Date.now().toString().slice(-4)}`,
          description: '',
          ruleIds: Array.isArray(rules) ? rules.map((r) => r.id) : [],
        });
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load salary structure details.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadStructureData();
  }, [loadStructureData]);

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => ({
      ...prev,
      ruleIds: prev.ruleIds.includes(ruleId)
        ? prev.ruleIds.filter((rid) => rid !== ruleId)
        : [...prev.ruleIds, ruleId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Structure name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Structure code is required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description || null,
      ruleIds: formData.ruleIds,
    };

    try {
      if (isEdit) {
        await salaryStructureApi.updateSalaryStructure(id, payload);
      } else {
        await salaryStructureApi.createSalaryStructure(payload);
      }
      navigate('/salary-structures');
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save salary structure.'));
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message='Loading salary structure...' />;
  if (error) return <ErrorState message={error} onRetry={loadStructureData} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <BackButton label='Back to Structures' fallback='/salary-structures' onClick={() => navigate('/salary-structures')} />

      <PageHeader
        title={isEdit ? 'Edit Salary Structure' : 'Create Salary Structure'}
        subtitle='Define salary template and select computational rules.'
      />

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      <div className='bg-white rounded-2xl border p-6 sm:p-8'>
        <form onSubmit={handleSubmit} className='space-y-4 text-xs'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold mb-1.5'>Structure Name *</label>
              <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
            </div>
            <div>
              <label className='block font-bold mb-1.5'>Structure Code *</label>
              <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border font-mono' />
            </div>
          </div>

          <div>
            <label className='block font-bold mb-1.5'>Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
          </div>

          {/* Assigned Rules */}
          <div className='space-y-2 border-t pt-4'>
            <div className='flex items-center justify-between'>
              <label className='font-bold'>
                Assigned Rules ({formData.ruleIds.length} of {availableRules.length})
              </label>
              <button
                type='button'
                onClick={() =>
                  setFormData({
                    ...formData,
                    ruleIds: formData.ruleIds.length === availableRules.length
                      ? []
                      : availableRules.map((r) => r.id),
                  })
                }
                className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
              >
                {formData.ruleIds.length === availableRules.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className='max-h-64 overflow-y-auto divide-y border rounded-xl p-2'>
              {availableRules.length === 0 ? (
                <p className='text-center text-gray-400 py-6'>No salary rules available. Create rules first.</p>
              ) : (
                availableRules.map((rule) => {
                  const checked = formData.ruleIds.includes(rule.id);
                  return (
                    <div
                      key={rule.id}
                      onClick={() => handleToggleRule(rule.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer ${checked ? 'bg-white font-semibold' : 'text-gray-500'}`}
                    >
                      <div className='flex items-center gap-2.5'>
                        <input type='checkbox' checked={checked} onChange={() => {}} className='rounded' />
                        <span>{rule.name}</span>
                      </div>
                      <span className='font-mono text-[10px] text-[#714B67] font-bold'>
                        {rule.code} • {rule.category}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className='pt-4 flex justify-end gap-2 border-t'>
            <button
              type='button'
              onClick={() => navigate('/salary-structures')}
              className='px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-all cursor-pointer'
            >
              Cancel
            </button>
            <button type='submit' disabled={isSubmitting} className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Structure' : 'Create Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}