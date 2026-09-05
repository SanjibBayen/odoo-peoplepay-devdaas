import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import { getSalaryRulesFromStorage } from '../../data/salaryData.js';

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState(() => getSalaryStructuresFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const availableRules = getSalaryRulesFromStorage();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    ruleIds: [],
    status: 'Active',
  });

  const loadStructures = () => {
    salaryStructureApi
      .getSalaryStructures()
      .then((res) => {
        setStructures(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load structures.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStructures();
  }, []);

  const handleOpenAdd = () => {
    setEditingStructure(null);
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
    setFormData({
      name: st.name,
      code: st.code,
      description: st.description || '',
      ruleIds: st.ruleIds || [],
      status: st.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleRuleToggle = (ruleId) => {
    setFormData((prev) => {
      const exists = prev.ruleIds.includes(ruleId);
      const ruleIds = exists
        ? prev.ruleIds.filter((id) => id !== ruleId)
        : [...prev.ruleIds, ruleId];
      return { ...prev, ruleIds };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingStructure) {
        await salaryStructureApi.updateSalaryStructure(editingStructure.id, formData);
      } else {
        await salaryStructureApi.createSalaryStructure(formData);
      }
      setIsModalOpen(false);
      await loadStructures();
    } catch (err) {
      alert(err.message || 'Failed to save salary structure');
    }
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Salary Structures'
        subtitle='Define organizational pay templates and associated compensation computation rules.'
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

      {loading ? (
        <LoadingState message='Loading salary structures...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStructures} />
      ) : structures.length === 0 ? (
        <EmptyState
          title='No salary structures configured'
          description='Create your initial workforce pay structure.'
          action={
            <button
              type='button'
              onClick={handleOpenAdd}
              className='px-3.5 py-1.5 rounded-xl bg-[#714B67] text-white text-xs font-bold'
            >
              Create Structure
            </button>
          }
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {structures.map((st) => (
            <div
              key={st.id}
              className='bg-white rounded-2xl p-5 border border-[#EAE6DF] shadow-2xs space-y-3.5 hover:border-gray-300 transition-all flex flex-col justify-between'
            >
              <div className='space-y-2'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h4 className='text-sm font-black text-[#1E293B]'>{st.name}</h4>
                    <span className='text-[10px] font-bold text-[#714B67]'>
                      {st.code}
                    </span>
                  </div>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                    {st.status}
                  </span>
                </div>
                <p className='text-xs text-gray-500 line-clamp-2'>
                  {st.description || 'Configured pay structure.'}
                </p>
              </div>

              <div className='pt-2 border-t border-gray-100'>
                <div className='text-[11px] font-bold text-gray-600 mb-1.5'>
                  Configured Salary Rules ({st.ruleIds?.length || 0})
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {(st.ruleIds || []).map((rId) => {
                    const rule = availableRules.find((r) => r.id === rId);
                    return (
                      <span
                        key={rId}
                        className='px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FAF8F5] border border-gray-200 text-gray-700'
                      >
                        {rule ? rule.code : rId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className='pt-2 border-t border-gray-100 flex items-center justify-between text-xs'>
                <span className='text-[11px] text-gray-400'>
                  Updated {st.updatedAt || 'Recent'}
                </span>
                <button
                  type='button'
                  onClick={() => handleOpenEdit(st)}
                  className='font-bold text-[#714B67] hover:underline cursor-pointer'
                >
                  Edit Structure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Structure Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-base font-black text-[#1E293B]'>
                {editingStructure ? 'Edit Salary Structure' : 'Create Salary Structure'}
              </h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold'
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className='space-y-3.5 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>Structure Name *</label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g. Technology Engineering Grade 1'
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
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Description</label>
                <textarea
                  rows='2'
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              {/* Rules Checklist */}
              <div>
                <label className='block font-bold text-gray-700 mb-1.5'>
                  Assign Salary Rules
                </label>
                <div className='space-y-1.5 border border-gray-200 rounded-xl p-3 bg-[#FAF8F5] max-h-40 overflow-y-auto'>
                  {availableRules.map((rule) => {
                    const isChecked = formData.ruleIds.includes(rule.id);
                    return (
                      <label
                        key={rule.id}
                        className='flex items-center gap-2 cursor-pointer text-xs'
                      >
                        <input
                          type='checkbox'
                          checked={isChecked}
                          onChange={() => handleRuleToggle(rule.id)}
                          className='w-3.5 h-3.5 rounded text-[#714B67] accent-[#714B67]'
                        />
                        <span className='font-bold text-gray-800'>{rule.code}</span>
                        <span className='text-gray-500'>- {rule.name} (Seq {rule.sequence})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-3.5 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
