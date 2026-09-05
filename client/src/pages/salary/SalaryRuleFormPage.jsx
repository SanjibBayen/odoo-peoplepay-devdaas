import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import {
  SALARY_RULE_CATEGORIES,
  SALARY_CALCULATION_TYPES,
} from '../../utils/constants.js';

export default function SalaryRuleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sequence: 10,
    category: 'BASIC',
    calculationType: 'FIXED',
    fixedAmount: 25000,
    percentage: '',
    baseRuleCode: 'BASIC',
    formula: '',
    description: '',
  });

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await salaryRuleApi.getSalaryRuleById(id);
        const rule = res.data || res;
        if (!active) return;
        setFormData({
          name: rule.name || '',
          code: rule.code || '',
          sequence: rule.sequence || 10,
          category: rule.category || 'BASIC',
          calculationType: rule.calculationType || rule.type || 'FIXED',
          fixedAmount: rule.fixedAmount || rule.amount || '',
          percentage: rule.percentage || '',
          baseRuleCode: rule.baseRuleCode || 'BASIC',
          formula: rule.formula || '',
          description: rule.description || '',
        });
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load salary rule.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Rule name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Rule code is required.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      sequence: Number(formData.sequence) || 10,
      category: formData.category,
      calculationType: formData.calculationType,
      description: formData.description,
      fixedAmount:
        formData.calculationType === 'FIXED' ? Number(formData.fixedAmount) : undefined,
      percentage:
        formData.calculationType === 'PERCENTAGE' ? Number(formData.percentage) : undefined,
      baseRuleCode:
        formData.calculationType === 'PERCENTAGE' ? formData.baseRuleCode : undefined,
      formula: formData.calculationType === 'FORMULA' ? formData.formula : undefined,
    };

    try {
      if (isEdit) {
        await salaryRuleApi.updateSalaryRule(id, payload);
      } else {
        await salaryRuleApi.createSalaryRule(payload);
      }
      navigate('/salary-rules');
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save salary rule.'));
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message='Loading salary rule...' />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Salary Rules' fallback='/salary-rules' />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          {isEdit ? `Editing: ${formData.code}` : 'New Rule'}
        </span>
      </div>

      <PageHeader
        title={isEdit ? 'Edit Salary Rule' : 'Create Salary Rule'}
        subtitle='Define mathematical computation components: Fixed pay, percentage allowances, or formulas.'
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
              <label className='block font-bold text-gray-700 mb-1.5'>Rule Name *</label>
              <input
                type='text'
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g. Basic Salary'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Rule Code *</label>
              <input
                type='text'
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder='e.g. BASIC'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              >
                {SALARY_RULE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.value})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Sequence *</label>
              <input
                type='number'
                required
                value={formData.sequence}
                onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
          </div>

          <div>
            <label className='block font-bold text-gray-700 mb-1.5'>Calculation Type *</label>
            <select
              value={formData.calculationType}
              onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
              className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            >
              {SALARY_CALCULATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {formData.calculationType === 'FIXED' && (
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Fixed Amount (₹) *</label>
              <input
                type='number'
                required
                min='0'
                value={formData.fixedAmount}
                onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })}
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
              />
            </div>
          )}

          {formData.calculationType === 'PERCENTAGE' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block font-bold text-gray-700 mb-1.5'>Percentage (%) *</label>
                <input
                  type='number'
                  required
                  step='0.01'
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  placeholder='e.g. 50'
                  className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1.5'>Base Rule Code *</label>
                <input
                  type='text'
                  required
                  value={formData.baseRuleCode}
                  onChange={(e) => setFormData({ ...formData, baseRuleCode: e.target.value })}
                  placeholder='e.g. BASIC'
                  className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
                />
              </div>
            </div>
          )}

          {formData.calculationType === 'FORMULA' && (
            <div>
              <label className='block font-bold text-gray-700 mb-1.5'>Formula Expression *</label>
              <input
                type='text'
                required
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder='e.g. BASIC * 0.4 + HRA'
                className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono'
              />
            </div>
          )}

          <div>
            <label className='block font-bold text-gray-700 mb-1.5'>Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder='Component calculation context or statutory reference'
              className='w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#FAF8F5]'
            />
          </div>

          <div className='pt-4 flex justify-end gap-2 border-t border-gray-100'>
            <BackButton label='Cancel' fallback='/salary-rules' />
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-colors cursor-pointer ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving Rule...' : isEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
