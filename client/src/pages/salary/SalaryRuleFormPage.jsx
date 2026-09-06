import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

const SALARY_RULE_CATEGORIES = [
  { value: 'BASIC', label: 'Basic Salary' },
  { value: 'ALLOWANCE', label: 'Allowance' },
  { value: 'GROSS', label: 'Gross Salary' },
  { value: 'DEDUCTION', label: 'Deduction' },
  { value: 'TAX', label: 'Tax' },
  { value: 'CONTRIBUTION', label: 'Contribution' },
  { value: 'NET', label: 'Net Salary' },
];

const SALARY_CALCULATION_TYPES = [
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'PERCENTAGE', label: 'Percentage of Base Rule' },
  { value: 'FORMULA', label: 'Formula Expression' },
  { value: 'TAX', label: 'Tax Calculation' },
];

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

  const loadRule = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await salaryRuleApi.getSalaryRuleById(id);
      const rule = res?.data || res;
      setFormData({
        name: rule.name || '',
        code: rule.code || '',
        sequence: rule.sequence || 10,
        category: rule.category || 'BASIC',
        calculationType: rule.calculationType || 'FIXED',
        fixedAmount: rule.fixedAmount || '',
        percentage: rule.percentage || '',
        baseRuleCode: rule.baseRuleCode || 'BASIC',
        formula: rule.formula || '',
        description: rule.description || '',
      });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load salary rule.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadRule();
  }, [loadRule]);

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
      description: formData.description || null,
      fixedAmount: formData.calculationType === 'FIXED' ? Number(formData.fixedAmount) : null,
      percentage: formData.calculationType === 'PERCENTAGE' ? Number(formData.percentage) : null,
      baseRuleCode: formData.calculationType === 'PERCENTAGE' ? formData.baseRuleCode : null,
      formula: formData.calculationType === 'FORMULA' ? formData.formula : null,
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
  if (error) return <ErrorState message={error} onRetry={loadRule} />;

  return (
    <div className='max-w-3xl mx-auto space-y-6'>
      <BackButton label='Back to Salary Rules' onClick={() => navigate('/salary-rules')} />

      <PageHeader
        title={isEdit ? 'Edit Salary Rule' : 'Create Salary Rule'}
        subtitle='Define mathematical computation components.'
      />

      {formError && (
        <div className='p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold'>
          {formError}
        </div>
      )}

      <div className='bg-white rounded-2xl border p-6 sm:p-8'>
        <form onSubmit={handleSubmit} className='space-y-4 text-xs'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold mb-1.5'>Rule Name *</label>
              <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
            </div>
            <div>
              <label className='block font-bold mb-1.5'>Rule Code *</label>
              <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border font-mono' />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block font-bold mb-1.5'>Category *</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border cursor-pointer'>
                {SALARY_RULE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block font-bold mb-1.5'>Sequence *</label>
              <input type='number' required value={formData.sequence} onChange={(e) => setFormData({ ...formData, sequence: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
            </div>
          </div>

          <div>
            <label className='block font-bold mb-1.5'>Calculation Type *</label>
            <select value={formData.calculationType} onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border cursor-pointer'>
              {SALARY_CALCULATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {formData.calculationType === 'FIXED' && (
            <div>
              <label className='block font-bold mb-1.5'>Fixed Amount *</label>
              <input type='number' required min='0' value={formData.fixedAmount} onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
            </div>
          )}

          {formData.calculationType === 'PERCENTAGE' && (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block font-bold mb-1.5'>Percentage (%) *</label>
                <input type='number' required step='0.01' value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
              </div>
              <div>
                <label className='block font-bold mb-1.5'>Base Rule Code *</label>
                <input type='text' required value={formData.baseRuleCode} onChange={(e) => setFormData({ ...formData, baseRuleCode: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border font-mono' />
              </div>
            </div>
          )}

          {formData.calculationType === 'FORMULA' && (
            <div>
              <label className='block font-bold mb-1.5'>Formula Expression *</label>
              <input type='text' required value={formData.formula} onChange={(e) => setFormData({ ...formData, formula: e.target.value })} placeholder='e.g. BASIC * 0.4' className='w-full px-3.5 py-2.5 rounded-xl border font-mono' />
            </div>
          )}

          <div>
            <label className='block font-bold mb-1.5'>Description</label>
            <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3.5 py-2.5 rounded-xl border' />
          </div>

          <div className='pt-4 flex justify-end gap-2 border-t'>
            <BackButton label='Cancel' onClick={() => navigate('/salary-rules')} />
            <button type='submit' disabled={isSubmitting} className={`px-5 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}