import React, { useState } from 'react';
import { SALARY_RULE_CATEGORIES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

/**
 * Reusable salary rules list component with category filtering and search.
 *
 * @param {Object} props
 * @param {Array} props.rules - Array of rule objects
 * @param {Function} [props.onEdit] - Edit callback
 * @param {Function} [props.onDelete] - Delete callback
 */
export default function SalaryRuleList({ rules = [], onEdit, onDelete }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRules = rules.filter((r) => {
    const catMatches = selectedCategory === 'ALL' || r.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const nameMatches = !q || r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    return catMatches && nameMatches;
  });

  return (
    <div className='space-y-3'>
      {/* Search & Filter Strip */}
      <div className='flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs'>
        <div className='relative flex-1 max-w-xs'>
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search rules by name or code...'
            className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium'
          />
          <span className='absolute left-2.5 top-2 text-gray-400'>
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
          </span>
        </div>

        <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-gray-200 text-xs font-bold overflow-x-auto'>
          <button
            type='button'
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-white text-[#714B67] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All Categories
          </button>
          {SALARY_RULE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type='button'
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'bg-white text-[#714B67] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Table */}
      <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
              <tr>
                <th className='py-3 px-4'>Seq</th>
                <th className='py-3 px-4'>Rule Name</th>
                <th className='py-3 px-4'>Code</th>
                <th className='py-3 px-4'>Category</th>
                <th className='py-3 px-4'>Type</th>
                <th className='py-3 px-4'>Formula / Value</th>
                {(onEdit || onDelete) && <th className='py-3 px-4 text-right'>Actions</th>}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredRules.map((rule) => {
                const type = rule.calculationType || rule.type || 'FIXED';
                const valueDisplay =
                  type === 'FIXED'
                    ? formatCurrency(rule.fixedAmount || rule.amount || 0)
                    : type === 'PERCENTAGE'
                    ? `${rule.percentage}% of ${rule.baseRuleCode || 'BASIC'}`
                    : rule.formula || 'Custom Formula';

                return (
                  <tr key={rule.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 font-mono font-bold text-gray-400'>
                      {rule.sequence}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>{rule.name}</td>
                    <td className='py-3 px-4 font-mono font-bold text-[#714B67]'>{rule.code}</td>
                    <td className='py-3 px-4'>
                      <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700'>
                        {rule.category || 'BASIC'}
                      </span>
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-600'>{type}</td>
                    <td className='py-3 px-4 font-mono text-gray-800 text-[11px] font-semibold'>
                      {valueDisplay}
                    </td>
                    {(onEdit || onDelete) && (
                      <td className='py-3 px-4 text-right space-x-2'>
                        {onEdit && (
                          <button
                            type='button'
                            onClick={() => onEdit(rule)}
                            className='text-[#714B67] hover:underline font-bold cursor-pointer'
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type='button'
                            onClick={() => onDelete(rule.id)}
                            className='text-rose-600 hover:underline font-bold cursor-pointer'
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
