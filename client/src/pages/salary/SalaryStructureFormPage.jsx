import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rulesRes = await salaryRuleApi.getSalaryRules();
        const rules = rulesRes.data || (Array.isArray(rulesRes) ? rulesRes : []);
        if (!active) return;
        setAvailableRules(rules);

        if (isEdit) {
          const structRes = await salaryStructureApi.getSalaryStructureById(id);
          const st = structRes.data || structRes;
          const assignedIds = st.rules ? st.rules.map((r) => r.id) : rules.map((r) => r.id);
          setFormData({
            name: st.name || '',
            code: st.code || '',
            description: st.description || '',
            ruleIds: assignedIds,
          });
        } else {
          setFormData({
            name: '',
            code: `STR-${Date.now().toString().slice(-4)}`,
            description: '',
            ruleIds: rules.map((r) => r.id),
          });
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load salary structure details.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const handleToggleRule = (ruleId) => {
    setFormData((prev) => ({
      ...prev,
      ruleIds: prev.ruleIds.includes(ruleId)
        ? prev.ruleIds.filter((id) => id !== ruleId)
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
      description: formData.description,
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
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Structures' fallback='/salary-structures' />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          {isEdit ? `Editing: ${formData.code}` : 'New Structure'}
        </span>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Salary Structure' : 'Create Salary Structure'}
        subtitle='Define salary template and select computational rules to apply during monthly payruns.'
      />

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-xs p-6 sm:p-8'>
        <form onSubmit={handleSubmit} className='space-y-4 text-xs'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Structure Name *
              </label>
              <input
                type='text'
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g. Senior Software Engineer Grade 2'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>
                Structure Code *
              </label>
              <input
                type='text'
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='e.g. ENG-SR-2'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
              />
            </div>
          </div>

          <div>
            <label className='block font-bold text-gray-700 mb-1.5'>Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Eligible roles and compensation bracket rationale'
              className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          {/* Assigned Rules Selector */}
          <div className='space-y-2 border-t border-gray-100 pt-4'>
            <div className='flex items-center justify-between'>
              <label className='font-bold text-gray-800 text-xs'>
                Assigned Salary Rules ({formData.ruleIds.length} of {availableRules.length})
              </label>
              <button
                type='button'
                onClick={() =>
                  setFormData({
                    ...formData,
                    ruleIds:
                      formData.ruleIds.length === availableRules.length
                        ? []
                        : availableRules.map((r) => r.id),
                  })
                }
                className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
              >
                {formData.ruleIds.length === availableRules.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className='max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl bg-[#FAF8F5] p-2'>
              {availableRules.map((rule) => {
                const checked = formData.ruleIds.includes(rule.id);
                return (
                  <div
                    key={rule.id}
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                      checked
                        ? 'bg-white shadow-2xs font-semibold text-gray-900'
                        : 'text-gray-500 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className='flex items-center gap-2.5'>
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => {}}
                        className='rounded text-[#714B67] focus:ring-[#714B67]'
                      />
                      <span>{rule.name}</span>
                    </div>
                    <span className='font-mono text-[10px] text-[#714B67] font-bold'>
                      {rule.code} • {rule.category || 'EARNING'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className='pt-4 flex justify-end gap-2 border-t border-gray-100'>
            <BackButton label='Cancel' fallback='/salary-structures' />
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving Structure...' : isEdit ? 'Update Structure' : 'Create Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
