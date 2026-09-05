import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import auditLogApi from '../../services/auditLogApi.js';
import { INITIAL_AUDIT_LOGS } from '../../data/adminData.js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState(() => INITIAL_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLogs = () => {
    auditLogApi
      .getAuditLogs()
      .then((res) => {
        setLogs(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load audit trail');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Security Audit Logs'
        subtitle='Immutable tracking of administrative actions, payroll updates, and authentication events.'
      />

      {loading ? (
        <LoadingState message='Loading security audit logs...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLogs} />
      ) : logs.length === 0 ? (
        <EmptyState title='No audit records found' />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <table className='w-full text-left text-xs'>
            <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
              <tr>
                <th className='py-3 px-4'>Timestamp</th>
                <th className='py-3 px-4'>Actor</th>
                <th className='py-3 px-4'>Action</th>
                <th className='py-3 px-4'>Module</th>
                <th className='py-3 px-4'>Details</th>
                <th className='py-3 px-4'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {logs.map((log) => (
                <tr key={log.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                  <td className='py-3 px-4 font-mono text-[11px] text-gray-500'>
                    {log.timestamp}
                  </td>
                  <td className='py-3 px-4'>
                    <div className='font-bold text-gray-900'>{log.user}</div>
                    <div className='text-[10px] text-gray-400'>{log.role}</div>
                  </td>
                  <td className='py-3 px-4 font-mono font-bold text-gray-800 text-[11px]'>
                    {log.action}
                  </td>
                  <td className='py-3 px-4 text-gray-600 font-medium'>
                    {log.module}
                  </td>
                  <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                    {log.detail}
                  </td>
                  <td className='py-3 px-4'>
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
