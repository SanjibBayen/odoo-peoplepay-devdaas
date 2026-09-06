import React, { useEffect, useState, useCallback } from 'react';
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
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditLogApi.getAuditLogs();
      const data = res?.data || res?.logs || [];
      setLogs(Array.isArray(data) ? data : []);
      
      if (res?.meta) {
        setMeta(res.meta);
      } else if (res?.pagination) {
        setMeta(res.pagination);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load audit trail'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    try {
      return new Date(timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Get actor name
  const getActorName = (log) => {
    if (log.user?.fullName) return log.user.fullName;
    if (log.user?.firstName && log.user?.lastName) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    if (log.user?.email) return log.user.email;
    return log.userId || 'System';
  };

  // Get status badge
  const getStatusBadge = (log) => {
    const status = log.status || 'SUCCESS';
    const isSuccess = status === 'SUCCESS' || status === 'success';
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          isSuccess
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Security Audit Logs'
        subtitle='Immutable tracking of administrative actions, payroll updates, and authentication events.'
        actions={
          <button
            type='button'
            onClick={loadLogs}
            disabled={loading}
            className='px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 disabled:opacity-50'
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

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
        <>
          {/* Log count */}
          <div className='flex items-center justify-between px-1'>
            <span className='text-xs text-gray-500'>
              {meta.total || logs.length} total records
            </span>
            <span className='text-[10px] text-gray-400'>
              Page {meta.page || 1} of {meta.totalPages || 1}
            </span>
          </div>

          <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-xs'>
                <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                  <tr>
                    <th className='py-3 px-4'>Timestamp</th>
                    <th className='py-3 px-4'>Actor</th>
                    <th className='py-3 px-4'>Action</th>
                    <th className='py-3 px-4'>Entity Type</th>
                    <th className='py-3 px-4'>Details</th>
                    <th className='py-3 px-4'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {logs.map((log) => (
                    <tr key={log.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                      <td className='py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap'>
                        {formatTimestamp(log.createdAt || log.timestamp)}
                      </td>
                      <td className='py-3 px-4 font-bold text-gray-900 whitespace-nowrap'>
                        {getActorName(log)}
                      </td>
                      <td className='py-3 px-4 font-semibold text-[#714B67] whitespace-nowrap'>
                        {log.action}
                      </td>
                      <td className='py-3 px-4 text-gray-600 font-medium whitespace-nowrap'>
                        {log.entityType || log.module || '—'}
                      </td>
                      <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                        {log.details || log.message || log.oldValues || log.newValues || '—'}
                      </td>
                      <td className='py-3 px-4'>{getStatusBadge(log)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}