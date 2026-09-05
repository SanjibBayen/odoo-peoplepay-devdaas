import React from 'react';
import StatusBadge from '../common/StatusBadge.jsx';

/**
 * Payrun status and batch lifecycle progress card.
 *
 * @param {Object} props
 * @param {Object} props.payrun - Payrun info object
 * @param {Function} [props.onAction] - Optional action handler
 */
export default function PayrollStatusCard({ payrun, onAction }) {
  if (!payrun) return null;

  return (
    <div className='bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE6DF] shadow-2xs'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-gray-100 flex-wrap'>
        <div>
          <div className='flex items-center gap-2'>
            <h3 className='text-xs sm:text-sm font-bold text-[#1E293B]'>
              {payrun.title}
            </h3>
            <StatusBadge status={payrun.status} />
          </div>
          <p className='text-[10px] text-gray-400 font-mono mt-0.5'>
            Batch ID: {payrun.batchCode}
          </p>
        </div>

        {onAction && (
          <button
            type='button'
            onClick={onAction}
            className='px-3 py-1.5 rounded-lg bg-[#714B67] text-white hover:bg-[#5E3E56] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1'
          >
            <span>Authorize Disbursement</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Financial Numbers Grid */}
      <div className='grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-gray-200/60 mb-3'>
        <div>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Gross Wages
          </span>
          <span className='text-sm sm:text-base font-extrabold text-[#1E293B]'>
            {payrun.totalGross}
          </span>
        </div>
        <div>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Net Disbursal
          </span>
          <span className='text-sm sm:text-base font-extrabold text-[#714B67]'>
            {payrun.totalNet}
          </span>
        </div>
        <div>
          <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider block'>
            Statutory Deductions
          </span>
          <span className='text-sm sm:text-base font-extrabold text-gray-700'>
            {payrun.totalDeductions}
          </span>
        </div>
      </div>

      {/* Verification Flags */}
      <div className='flex items-center justify-between text-[11px] text-gray-500 pt-1'>
        <span className='flex items-center gap-1.5 text-emerald-700 font-semibold'>
          <span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
          Statutory Compliance Verified
        </span>
        <span className='text-gray-400'>
          Target: {payrun.targetDisbursalDate}
        </span>
      </div>
    </div>
  );
}
