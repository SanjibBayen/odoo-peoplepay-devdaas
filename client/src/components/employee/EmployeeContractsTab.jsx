import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import employeeApi from '../../services/employeeApi.js';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { extractErrorMessage } from '../../services/apiClient.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { selectCurrentRole } from '../../redux/selectors/authSelectors.js';

const CONTRACT_STATUS = {
  DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EXPIRED: { label: 'Expired', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  TERMINATED: { label: 'Terminated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function EmployeeContractsTab({ employeeId }) {
  const currentRole = useSelector(selectCurrentRole) || 'employee';
  const isEmployee = currentRole.toLowerCase().includes('employee');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);

  const fetchContracts = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      setContracts([]);
      return;
    }
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
                    <button
                      type='button'
                      onClick={() => setSelectedContract(c)}
                      className='text-xs font-bold text-[#714B67] hover:underline cursor-pointer'
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs'>
          <div className='bg-white rounded-3xl p-6 max-w-md w-full border border-[#EAE6DF] shadow-2xl space-y-4'>
            <div className='flex items-center justify-between pb-3 border-b border-gray-100'>
              <div>
                <span className='text-[10px] font-bold uppercase tracking-wider text-gray-400'>Employment Contract</span>
                <h3 className='text-sm font-bold text-[#1E293B]'>{selectedContract.contractNumber || 'Contract Terms'}</h3>
              </div>
              <button
                type='button'
                onClick={() => setSelectedContract(null)}
                className='w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs text-gray-600 cursor-pointer'
              >
                ✕
              </button>
            </div>
            <div className='grid grid-cols-2 gap-3 text-xs'>
              <div className='p-3 rounded-xl bg-[#FAF8F5]'>
                <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Monthly Wage</span>
                <span className='font-bold text-[#714B67] text-sm'>{formatCurrency(selectedContract.wage || 0)}</span>
              </div>
              <div className='p-3 rounded-xl bg-[#FAF8F5]'>
                <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Status</span>
                <span className='font-bold text-emerald-700 capitalize'>{selectedContract.status || 'Active'}</span>
              </div>
              <div className='p-3 rounded-xl bg-[#FAF8F5]'>
                <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Effective From</span>
                <span className='font-medium text-gray-700'>{formatDate(selectedContract.startDate, 'DD Mon YYYY')}</span>
              </div>
              <div className='p-3 rounded-xl bg-[#FAF8F5]'>
                <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Expires On</span>
                <span className='font-medium text-gray-700'>{selectedContract.endDate ? formatDate(selectedContract.endDate, 'DD Mon YYYY') : 'Permanent / Open'}</span>
              </div>
              <div className='col-span-2 p-3 rounded-xl bg-[#FAF8F5]'>
                <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Salary Structure</span>
                <span className='font-semibold text-gray-800'>{selectedContract.salaryStructure?.name || 'Standard Structure'}</span>
              </div>
              {selectedContract.notes && (
                <div className='col-span-2 p-3 rounded-xl bg-[#FAF8F5]'>
                  <span className='text-[10px] text-gray-400 block uppercase font-semibold'>Terms & Notes</span>
                  <p className='text-gray-600 text-[11px] mt-0.5'>{selectedContract.notes}</p>
                </div>
              )}
            </div>
            <div className='flex justify-end gap-2 pt-2 border-t border-gray-100'>
              {!isEmployee && (
                <Link
                  to={`/contracts/${selectedContract.id}`}
                  className='px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] transition-colors'
                >
                  Manage Contract →
                </Link>
              )}
              <button
                type='button'
                onClick={() => setSelectedContract(null)}
                className='px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 cursor-pointer'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}