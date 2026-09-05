import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import auditLogApi from '../../services/auditLogApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const loadLogs = () => {
    setLoading(true);
    setError(null);
    return auditLogApi
      .getAuditLogs()
      .then((res) => {
        setLogs(res.data || []);
        if (res.pending) setIsPending(true);
      })
      .catch((err) => {
        setError(extractErrorMessage(err, 'Failed to load audit trail'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    auditLogApi
      .getAuditLogs()
      .then((res) => {
        if (!active) return;
        setLogs(res.data || []);
        if (res.pending) setIsPending(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to load audit trail'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Security Audit Logs'
        subtitle='Immutable tracking of administrative actions, payroll updates, and authentication events.'
      />

      {isPending && (
        <div className='p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2'>
          <span>ℹ️</span>
          <span>Security Audit Trail API (<code>GET /api/audit-logs</code>) is pending on backend. System actions will stream here once available.</span>
        </div>
      )}

      {loading ? (
        <LoadingState message='Loading security audit logs...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title='No audit records found'
          description='Security events and operational transactions will be displayed here.'
        />
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
                  <td className='py-3 px-4 font-bold text-gray-900'>
                    {log.actor}
                  </td>
                  <td className='py-3 px-4 font-semibold text-[#714B67]'>
                    {log.action}
                  </td>
                  <td className='py-3 px-4 text-gray-600 font-medium'>
                    {log.module}
                  </td>
                  <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                    {log.details}
                  </td>
                  <td className='py-3 px-4'>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
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
