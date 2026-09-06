import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import contractApi from '../../services/contractApi.js';
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

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const loadContract = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractApi.getContractById(id);
      // FIX: Backend returns { success, data }
      const data = res?.data || res;
      setContract(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load contract details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleActivate = async () => {
    setIsActionSubmitting(true);
    try {
      await contractApi.activateContract(id);
      await loadContract();
      setStatusBanner({ type: 'success', text: 'Contract activated.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to activate contract') });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleConfirmTerminate = async () => {
    setIsActionSubmitting(true);
    try {
      await contractApi.terminateContract(id, { terminationReason: 'Terminated by HR' });
      setIsTerminateOpen(false);
      await loadContract();
      setStatusBanner({ type: 'success', text: 'Contract terminated.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to terminate contract') });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  if (loading) return <LoadingState message='Loading contract details...' />;
  if (error || !contract) {
    return <ErrorState message={error || 'Contract not found.'} onRetry={loadContract} />;
  }

  const emp = contract.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : contract.employeeName || 'Employee';
  const empCode = emp.employeeCode || contract.employeeId || 'EMP-000';
  const code = contract.contractNumber || contract.id;
  const structName = contract.salaryStructure?.name || 'Standard Package';
  const wage = Number(contract.wage || 0);
  const st = (contract.status || 'ACTIVE').toUpperCase();
  const badge = CONTRACT_STATUS[st] || CONTRACT_STATUS.ACTIVE;

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <BackButton label='Back to Contracts' onClick={() => navigate('/contracts')} />
        <span className='text-xs font-mono font-bold text-gray-500 bg-[#FAF8F5] px-3 py-1 rounded-xl border border-gray-200'>
          {code}
        </span>
      </div>

      {statusBanner && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
          statusBanner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type='button' onClick={() => setStatusBanner(null)} className='font-bold ml-2 cursor-pointer'>✕</button>
        </div>
      )}

      {/* Main Card */}
      <div className='bg-white rounded-3xl border border-[#EAE6DF] shadow-2xs p-6 sm:p-8 space-y-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-3'>
              <h1 className='text-xl sm:text-2xl font-black text-[#1E293B]'>Employment Contract</h1>
              <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
            </div>
            <p className='text-xs text-gray-500'>
              Assigned to{' '}
              <Link to={`/employees/${emp.id || contract.employeeId}`} className='text-[#714B67] font-bold hover:underline'>
                {empName} ({empCode})
              </Link>
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <button type='button' onClick={() => navigate(`/contracts/${id}/edit`)} className='px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer'>
              Edit Contract
            </button>

            {st !== 'ACTIVE' && (
              <button type='button' disabled={isActionSubmitting} onClick={handleActivate} className='px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer'>
                Activate Contract
              </button>
            )}

            {st === 'ACTIVE' && (
              <button type='button' onClick={() => setIsTerminateOpen(true)} className='px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer'>
                Terminate Contract
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE6DF] text-xs'>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Monthly Wage</span>
            <span className='text-base font-black text-gray-900 block mt-0.5'>{formatCurrency(wage)}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Salary Structure</span>
            <span className='font-bold text-gray-800 block mt-0.5'>{structName}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>Start Date</span>
            <span className='font-semibold text-gray-800 block mt-0.5'>{formatDate(contract.startDate, 'DD Mon YYYY')}</span>
          </div>
          <div>
            <span className='text-[10px] font-bold text-gray-400 uppercase block'>End Date</span>
            <span className='font-semibold text-gray-800 block mt-0.5'>
              {contract.endDate ? formatDate(contract.endDate, 'DD Mon YYYY') : 'Open-Ended'}
            </span>
          </div>
        </div>

        {/* Schedule */}
        <div className='space-y-3 pt-2 text-xs'>
          <h3 className='font-bold uppercase tracking-wider text-gray-700 text-[11px] border-b border-gray-100 pb-2'>Work Terms & Schedule</h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <span className='text-gray-400 block'>Assigned Work Schedule:</span>
              <strong className='text-gray-900 block mt-0.5'>{contract.schedule?.name || 'Standard'}</strong>
            </div>
            <div>
              <span className='text-gray-400 block'>Wage Type:</span>
              <strong className='text-gray-900 block mt-0.5'>{contract.wageType || 'MONTHLY'}</strong>
            </div>
          </div>
        </div>
      </div>

      {isTerminateOpen && (
        <ConfirmDialog
          isOpen={isTerminateOpen}
          title='Terminate Contract'
          message={`Are you sure you want to terminate employment contract ${code} for ${empName}?`}
          confirmLabel='Confirm Termination'
          isDestructive={true}
          onConfirm={handleConfirmTerminate}
          onCancel={() => setIsTerminateOpen(false)}
        />
      )}
    </div>
  );
}