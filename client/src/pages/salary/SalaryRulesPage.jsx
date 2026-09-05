import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import salaryRuleApi from '../../services/salaryRuleApi.js';
import { getSalaryRulesFromStorage, RULE_TYPES } from '../../data/salaryData.js';

export default function SalaryRulesPage() {
  const [rules, setRules] = useState(() =>
    getSalaryRulesFromStorage().sort(
      (a, b) => Number(a.sequence) - Number(b.sequence)
    )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sequence: 10,
    type: 'FIXED',
    amount: '',
    percentage: '',
    condition: 'true',
    status: 'Active',
    category: 'Earning',
    description: '',
  });

  const loadRules = () => {
    salaryRuleApi
      .getSalaryRules()
      .then((res) => {
        // Ensure sorted by sequence
        const sorted = (res.data || []).sort(
          (a, b) => Number(a.sequence) - Number(b.sequence)
        );
        setRules(sorted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load salary rules.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      code: '',
      sequence: (rules.length + 1) * 10,
      type: 'FIXED',
      amount: '',
      percentage: '',
      condition: 'true',
      status: 'Active',
      category: 'Earning',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      code: rule.code,
      sequence: rule.sequence,
      type: rule.type,
      amount: rule.amount ?? '',
      percentage: rule.percentage ?? '',
      condition: rule.condition || 'true',
      status: rule.status || 'Active',
      category: rule.category || 'Earning',
      description: rule.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      sequence: Number(formData.sequence),
      amount: formData.amount ? Number(formData.amount) : null,
      percentage: formData.percentage ? Number(formData.percentage) : null,
    };

    try {
      setFormError(null);
      setIsSubmitting(true);
      if (editingRule) {
        await salaryRuleApi.updateSalaryRule(editingRule.id, payload);
      } else {
        await salaryRuleApi.createSalaryRule(payload);
      }
      setIsModalOpen(false);
      await loadRules();
    } catch (err) {
      setFormError(err.message || 'Failed to save rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Salary Rules'
        subtitle='Configurable compensation and deduction rules executed strictly in ascending sequence.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>Add Rule</span>
          </button>
        }
      />

      {loading ? (
        <LoadingState message='Loading salary rules in sequence...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadRules} />
      ) : rules.length === 0 ? (
        <EmptyState
          title='No salary rules configured'
          description='Create your first compensation rule.'
          action={
            <button
              type='button'
              onClick={handleOpenAdd}
              className='px-3.5 py-1.5 rounded-xl bg-[#714B67] text-white text-xs font-bold'
            >
              Add First Rule
            </button>
          }
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4 w-16 text-center'>Seq</th>
                  <th className='py-3 px-4'>Rule Name & Code</th>
                  <th className='py-3 px-4'>Category</th>
                  <th className='py-3 px-4'>Rule Type</th>
                  <th className='py-3 px-4'>Computation</th>
                  <th className='py-3 px-4'>Condition</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {rules.map((rule) => (
                  <tr key={rule.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 text-center font-black text-gray-900 bg-gray-50/50'>
                      #{rule.sequence}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{rule.name}</div>
                      <div className='text-[10px] text-gray-500'>{rule.code}</div>
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          rule.category === 'Earning'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {rule.category}
                      </span>
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-700'>
                      {rule.type}
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-800'>
                      {rule.type === 'PERCENTAGE' && `${rule.percentage}% of Base`}
                      {rule.type === 'FIXED' && `Fixed ₹${rule.amount?.toLocaleString()}`}
                      {rule.type === 'FORMULA' && 'Dynamic Formula Calculation'}
                      {rule.type === 'TAX' && `${rule.percentage || 10}% Progressive Slab`}
                    </td>
                    <td className='py-3 px-4 font-mono text-[11px] text-gray-500'>
                      {rule.condition}
                    </td>
                    <td className='py-3 px-4'>
                      <span className='inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                        {rule.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <button
                        type='button'
                        onClick={() => handleOpenEdit(rule)}
                        className='font-bold text-[#714B67] hover:underline cursor-pointer'
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Rule Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-base font-black text-[#1E293B]'>
                {editingRule ? 'Edit Salary Rule' : 'Add Salary Rule'}
              </h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold'
                aria-label='Close'
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
                  <label className='block font-bold text-gray-700 mb-1'>Rule Name *</label>
                  <input
                    type='text'
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='e.g. Basic Salary'
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
                    placeholder='e.g. BASIC'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-2.5'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Sequence *</label>
                  <input
                    type='number'
                    required
                    value={formData.sequence}
                    onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className='w-full px-2 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    <option value='Earning'>Earning</option>
                    <option value='Deduction'>Deduction</option>
                  </select>
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className='w-full px-2 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === 'PERCENTAGE' && (
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Percentage (%) *</label>
                  <input
                    type='number'
                    required
                    value={formData.percentage}
                    onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                    placeholder='50'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              )}

              {formData.type === 'FIXED' && (
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Fixed Amount (₹) *</label>
                  <input
                    type='number'
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder='200'
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              )}

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Evaluation Condition</label>
                <input
                  type='text'
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder='e.g. contract.wage > 0'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] font-mono text-[11px]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <input
                  type='text'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder='Notes for payroll validation...'
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
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
