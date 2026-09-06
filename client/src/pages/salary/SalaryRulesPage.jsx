import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

const RULE_TYPES = ['FIXED', 'PERCENTAGE', 'FORMULA', 'TAX'];
const CATEGORIES = ['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'TAX', 'CONTRIBUTION', 'NET'];

export default function SalaryRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sequence: 10,
    calculationType: 'FIXED',
    fixedAmount: '',
    percentage: '',
    baseRuleCode: 'BASIC',
    formula: '',
    category: 'BASIC',
    description: '',
  });

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salaryRuleApi.getSalaryRules();
      // FIX: Backend returns { success, data }
      const list = res?.data || [];
      const sorted = [...list].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0));
      setRules(Array.isArray(sorted) ? sorted : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load salary rules.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormError(null);
    setFormData({
      name: '',
      code: '',
      sequence: (rules.length + 1) * 10,
      calculationType: 'FIXED',
      fixedAmount: 25000,
      percentage: '',
      baseRuleCode: 'BASIC',
      formula: '',
      category: 'BASIC',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormError(null);
    setFormData({
      name: rule.name || '',
      code: rule.code || '',
      sequence: rule.sequence || 10,
      calculationType: rule.calculationType || 'FIXED',
      fixedAmount: rule.fixedAmount || '',
      percentage: rule.percentage || '',
      baseRuleCode: rule.baseRuleCode || 'BASIC',
      formula: rule.formula || '',
      category: rule.category || 'BASIC',
      description: rule.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await salaryRuleApi.deleteSalaryRule(id);
      setStatusBanner({ type: 'success', text: 'Salary rule deleted.' });
      await loadRules();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to delete rule') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
      if (editingRule) {
        await salaryRuleApi.updateSalaryRule(editingRule.id, payload);
        setStatusBanner({ type: 'success', text: 'Salary rule updated.' });
      } else {
        await salaryRuleApi.createSalaryRule(payload);
        setStatusBanner({ type: 'success', text: 'New salary rule created.' });
      }
      setIsModalOpen(false);
      await loadRules();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save salary rule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeDisplay = (rule) => {
    const type = rule.calculationType || 'FIXED';
    if (type === 'FIXED') return formatCurrency(rule.fixedAmount || 0);
    if (type === 'PERCENTAGE') return `${rule.percentage}% of ${rule.baseRuleCode || 'BASIC'}`;
    return rule.formula || 'Custom';
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Salary Rules'
        subtitle='Define mathematical computation components: Fixed pay, percentage allowances, and deductions.'
        actions={
          <button type='button' onClick={handleOpenAdd} className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] rounded-xl cursor-pointer'>
            + New Rule
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
        <LoadingState message='Loading salary rules...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRules} />
      ) : rules.length === 0 ? (
        <EmptyState title='No salary rules configured' description='Create salary rules like Basic Pay, HRA, or PF.' actionLabel='+ New Rule' onAction={handleOpenAdd} />
      ) : (
        <div className='bg-white rounded-2xl border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Seq</th>
                  <th className='py-3 px-4'>Rule Name</th>
                  <th className='py-3 px-4'>Code</th>
                  <th className='py-3 px-4'>Category</th>
                  <th className='py-3 px-4'>Type</th>
                  <th className='py-3 px-4'>Formula / Value</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {rules.map((rule) => (
                  <tr key={rule.id} className='hover:bg-[#FAF8F5]/60'>
                    <td className='py-3 px-4 font-mono font-bold'>{rule.sequence}</td>
                    <td className='py-3 px-4 font-bold'>{rule.name}</td>
                    <td className='py-3 px-4 font-mono font-bold text-[#714B67]'>{rule.code}</td>
                    <td className='py-3 px-4'>
                      <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100'>{rule.category}</span>
                    </td>
                    <td className='py-3 px-4'>{rule.calculationType}</td>
                    <td className='py-3 px-4 font-mono text-[11px]'>{getTypeDisplay(rule)}</td>
                    <td className='py-3 px-4 text-right space-x-2'>
                      <button type='button' onClick={() => handleOpenEdit(rule)} className='text-[#714B67] hover:underline font-bold cursor-pointer'>Edit</button>
                      <button type='button' onClick={() => handleDelete(rule.id)} className='text-rose-600 hover:underline font-bold cursor-pointer'>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40' role='dialog' aria-modal='true'>
          <div className='bg-white rounded-2xl max-w-md w-full p-5 border shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b pb-3'>
              <h3 className='text-sm font-black'>{editingRule ? 'Edit Salary Rule' : 'New Salary Rule'}</h3>
              <button type='button' onClick={() => setIsModalOpen(false)} className='cursor-pointer'>✕</button>
            </div>

            {formError && <div className='p-2.5 rounded-xl bg-red-50 border text-red-700 text-xs'>{formError}</div>}

            <form onSubmit={handleSave} className='space-y-3 text-xs'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold mb-1'>Rule Name *</label>
                  <input type='text' required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
                <div>
                  <label className='block font-bold mb-1'>Rule Code *</label>
                  <input type='text' required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold mb-1'>Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className='block font-bold mb-1'>Sequence</label>
                  <input type='number' value={formData.sequence} onChange={(e) => setFormData({ ...formData, sequence: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              </div>

              <div>
                <label className='block font-bold mb-1'>Calculation Type *</label>
                <select value={formData.calculationType} onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })} className='w-full px-3 py-2 rounded-xl border cursor-pointer'>
                  {RULE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {formData.calculationType === 'FIXED' && (
                <div>
                  <label className='block font-bold mb-1'>Fixed Amount *</label>
                  <input type='number' required min='0' value={formData.fixedAmount} onChange={(e) => setFormData({ ...formData, fixedAmount: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              )}

              {formData.calculationType === 'PERCENTAGE' && (
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block font-bold mb-1'>Percentage (%) *</label>
                    <input type='number' required step='0.01' value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                  </div>
                  <div>
                    <label className='block font-bold mb-1'>Base Rule Code *</label>
                    <input type='text' required value={formData.baseRuleCode} onChange={(e) => setFormData({ ...formData, baseRuleCode: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                  </div>
                </div>
              )}

              {formData.calculationType === 'FORMULA' && (
                <div>
                  <label className='block font-bold mb-1'>Formula *</label>
                  <input type='text' required value={formData.formula} onChange={(e) => setFormData({ ...formData, formula: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
                </div>
              )}

              <div>
                <label className='block font-bold mb-1'>Description</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className='w-full px-3 py-2 rounded-xl border' />
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button type='submit' disabled={isSubmitting} className={`px-4 py-1.5 font-bold text-white bg-[#714B67] rounded-xl cursor-pointer ${isSubmitting ? 'opacity-60' : ''}`}>
                  {isSubmitting ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}