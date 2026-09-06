import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency.js';

const SALARY_RULE_CATEGORIES = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'ALLOWANCE', label: 'Allowance' },
  { value: 'GROSS', label: 'Gross' },
  { value: 'DEDUCTION', label: 'Deduction' },
  { value: 'TAX', label: 'Tax' },
  { value: 'CONTRIBUTION', label: 'Contribution' },
  { value: 'NET', label: 'Net' },
];

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
      {/* Search & Filter */}
      <div className='flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border'>
        <input
          type='text'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search rules by name or code...'
          className='px-3 py-1.5 rounded-xl border text-xs w-full max-w-xs'
        />

        <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border text-xs font-bold overflow-x-auto'>
          <button
            type='button'
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-lg cursor-pointer whitespace-nowrap ${selectedCategory === 'ALL' ? 'bg-white text-[#714B67]' : 'text-gray-500'}`}
          >
            All
          </button>
          {SALARY_RULE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type='button'
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-lg cursor-pointer whitespace-nowrap ${selectedCategory === cat.value ? 'bg-white text-[#714B67]' : 'text-gray-500'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Table */}
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
                {(onEdit || onDelete) && <th className='py-3 px-4 text-right'>Actions</th>}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className='py-8 text-center text-gray-400'>
                    No salary rules found.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const type = rule.calculationType || 'FIXED';
                  const valueDisplay =
                    type === 'FIXED'
                      ? formatCurrency(rule.fixedAmount || 0)
                      : type === 'PERCENTAGE'
                        ? `${rule.percentage}% of ${rule.baseRuleCode || 'BASIC'}`
                        : rule.formula || 'Custom';

                  return (
                    <tr key={rule.id} className='hover:bg-[#FAF8F5]/60'>
                      <td className='py-3 px-4 font-mono font-bold text-gray-400'>{rule.sequence}</td>
                      <td className='py-3 px-4 font-bold'>{rule.name}</td>
                      <td className='py-3 px-4 font-mono font-bold text-[#714B67]'>{rule.code}</td>
                      <td className='py-3 px-4'>
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100'>
                          {rule.category || 'BASIC'}
                        </span>
                      </td>
                      <td className='py-3 px-4'>{type}</td>
                      <td className='py-3 px-4 font-mono text-[11px]'>{valueDisplay}</td>
                      {(onEdit || onDelete) && (
                        <td className='py-3 px-4 text-right space-x-2'>
                          {onEdit && (
                            <button type='button' onClick={() => onEdit(rule)} className='text-[#714B67] hover:underline font-bold cursor-pointer'>Edit</button>
                          )}
                          {onDelete && (
                            <button type='button' onClick={() => onDelete(rule.id)} className='text-rose-600 hover:underline font-bold cursor-pointer'>Delete</button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}