import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

const CONTRACT_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function EmployeeContractsTab({ employeeId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployeeContracts(employeeId);
      // FIX: Backend returns { success, count, contracts }
      const list = res?.contracts || res?.data || [];
      setContracts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load employee contracts.'));
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  if (loading) return <LoadingState message='Loading employee contracts...' />;
  if (error) return <ErrorState message={error} onRetry={fetchContracts} />;
  if (contracts.length === 0) {
    return (
      <EmptyState
        title='No contracts on record'
        description='This employee currently has no active or archived employment contracts.'
      />
    );
  }

  return (
    <div className='bg-white rounded-2xl border overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full text-left text-xs'>
          <thead className='bg-[#FAF8F5] border-b text-gray-500 font-bold uppercase text-[10px]'>
            <tr>
              <th className='py-3 px-4'>Contract Code</th>
              <th className='py-3 px-4'>Salary Structure</th>
              <th className='py-3 px-4'>Monthly Wage</th>
              <th className='py-3 px-4'>Start Date</th>
              <th className='py-3 px-4'>End Date</th>
              <th className='py-3 px-4'>Status</th>
              <th className='py-3 px-4 text-right'>Action</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {contracts.map((c) => {
              const code = c.contractNumber || c.id;
              const structName = c.salaryStructure?.name || 'Standard';
              const wage = Number(c.wage || 0);
              const st = (c.status || 'ACTIVE').toUpperCase();
              const badge = CONTRACT_STATUS[st] || CONTRACT_STATUS.ACTIVE;

              return (
                <tr key={c.id} className='hover:bg-[#FAF8F5]/60'>
                  <td className='py-3 px-4 font-mono font-bold'>{code}</td>
                  <td className='py-3 px-4'>{structName}</td>
                  <td className='py-3 px-4 font-bold'>{formatCurrency(wage)}</td>
                  <td className='py-3 px-4'>{formatDate(c.startDate, 'DD Mon YYYY')}</td>
                  <td className='py-3 px-4'>
                    {c.endDate ? formatDate(c.endDate, 'DD Mon YYYY') : '(Open-ended)'}
                  </td>
                  <td className='py-3 px-4'>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className='py-3 px-4 text-right'>
                    <Link to={`/contracts/${c.id}`} className='text-xs font-bold text-[#714B67] hover:underline'>
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}