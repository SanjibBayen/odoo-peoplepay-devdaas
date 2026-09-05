import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import BackButton from '../../components/common/BackButton.jsx';
import contractApi from '../../services/contractApi.js';
import employeeApi from '../../services/employeeApi.js';
import salaryStructureApi from '../../services/salaryStructureApi.js';
import { extractErrorMessage } from '../../services/apiClient.js';

function normalizeContract(c) {
  if (!c) return null;
  const emp = c.employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ''}`.trim()
    : c.employeeName || 'Employee';
  const empCode = emp.employeeCode || c.employeeId || '';
  const deptName = c.department?.name || c.department || 'General';
  const posName = c.jobPosition?.name || c.jobPosition || 'Staff';
  const structName = c.salaryStructure?.name || c.structureName || 'Standard';

  return {
    ...c,
    id: c.id,
    contractCode: c.contractNumber || c.contractCode || c.id,
    employeeName: empName,
    employeeId: empCode,
    department: deptName,
    jobPosition: posName,
    salaryStructureId: c.salaryStructureId,
    structureName: structName,
    wage: Number(c.wage || 0),
    startDate: c.startDate,
    endDate: c.endDate,
    status:
      c.status === 'ACTIVE'
        ? 'Active'
        : c.status === 'DRAFT'
        ? 'Draft'
        : c.status === 'EXPIRED'
        ? 'Expired'
        : c.status === 'TERMINATED'
        ? 'Archived'
        : c.status || 'Active',
    rawStatus: c.status,
  };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [statusBanner, setStatusBanner] = useState(null);

  // Reference data loaded from APIs
  const [employees, setEmployees] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);

  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    wage: 100000,
    salaryStructureId: '',
  });


  const loadContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractApi.getContracts();
      const list = res.contracts || res.data || (Array.isArray(res) ? res : []);
      setContracts(list.map(normalizeContract));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to fetch contracts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [contractsRes, empRes, strRes] = await Promise.allSettled([
          contractApi.getContracts(),
          employeeApi.getEmployees({ limit: 100 }),
          salaryStructureApi.getSalaryStructures(),
        ]);
        if (!active) return;
        if (contractsRes.status === 'fulfilled') {
          const res = contractsRes.value;
          const list = res.contracts || res.data || (Array.isArray(res) ? res : []);
          setContracts(list.map(normalizeContract));
        } else {
          setError(extractErrorMessage(contractsRes.reason, 'Failed to fetch contracts.'));
        }
        if (empRes.status === 'fulfilled') {
          setEmployees(empRes.value.data || []);
        }
        if (strRes.status === 'fulfilled') {
          setSalaryStructures(strRes.value.data || (Array.isArray(strRes.value) ? strRes.value : []));
        }
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err, 'Failed to fetch contracts.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingContract(null);
    setFormError(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      employeeId: employees[0]?.id || '',
      startDate: today,
      endDate: '',
      wage: 100000,
      salaryStructureId: salaryStructures[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingContract(c);
    setFormError(null);
    setFormData({
      employeeId: c.employeeId || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      wage: c.wage || 100000,
      salaryStructureId: c.salaryStructureId || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingContract) {
        await contractApi.updateContract(editingContract.id, {
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          wage: Number(formData.wage),
          salaryStructureId: formData.salaryStructureId || undefined,
        });
        setStatusBanner({ type: 'success', text: 'Contract updated successfully.' });
      } else {
        await contractApi.createContract({
          employeeId: formData.employeeId,
          contractNumber: `CNT-${Date.now().toString().slice(-6)}`,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          wage: Number(formData.wage),
          wageType: 'MONTHLY',
          salaryStructureId: formData.salaryStructureId || undefined,
          status: 'ACTIVE',
        });
        setStatusBanner({ type: 'success', text: 'New contract created successfully.' });
      }
      setIsModalOpen(false);
      await loadContracts();
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Failed to save contract.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await contractApi.terminateContract(archiveTarget.id, {
        terminationReason: 'Archived via HR dashboard',
      });
      setArchiveTarget(null);
      await loadContracts();
      setStatusBanner({ type: 'success', text: 'Contract terminated/archived.' });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: extractErrorMessage(err, 'Failed to archive contract') });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesStatus =
      selectedStatus === 'All' || c.status === selectedStatus || c.rawStatus === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.employeeName?.toLowerCase().includes(q) ||
      c.employeeId?.toLowerCase().includes(q) ||
      c.contractCode?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1;
  const paginated = filteredContracts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Employment Contracts'
        subtitle='Manage compensation packages, structure bindings, and tenure status.'
        actions={
          <button
            type='button'
            onClick={handleOpenAdd}
            className='px-4 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1'
          >
            <span>+</span>
            <span>New Contract</span>
          </button>
        }
      />

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type='button'
            onClick={() => setStatusBanner(null)}
            className='font-bold ml-2 cursor-pointer'
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]'>
          <div className='relative flex-1 max-w-xs'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder='Search by contract code, employee or department...'
              className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
            />
            <span className='absolute left-2.5 top-2 text-gray-400'>
              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </span>
          </div>

          <div className='flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-gray-200 text-xs font-bold'>
            {['All', 'Active', 'Draft', 'Archived'].map((st) => (
              <button
                key={st}
                type='button'
                onClick={() => {
                  setSelectedStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-white text-[#714B67] shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filteredContracts.length} contracts
        </div>
      </div>

      {loading ? (
        <LoadingState message='Loading employee contracts...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadContracts} />
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          title='No contracts found'
          description='Create a new contract or refine your search query.'
          actionLabel='+ New Contract'
          onAction={handleOpenAdd}
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Contract Code</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Department & Position</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Monthly Wage</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginated.map((c) => (
                  <tr key={c.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4 font-mono font-bold text-gray-900'>
                      {c.contractCode}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{c.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{c.employeeId}</div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='font-semibold text-gray-800'>{c.department}</div>
                      <div className='text-[10px] text-gray-500'>{c.jobPosition}</div>
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-600'>
                      {c.startDate} {c.endDate ? `→ ${c.endDate}` : '(Open-ended)'}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>
                      ₹{c.wage.toLocaleString()}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'Draft'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <div className='inline-flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={() => handleOpenEdit(c)}
                          className='text-[#714B67] hover:underline font-bold cursor-pointer'
                        >
                          Edit
                        </button>
                        {c.status !== 'Archived' && (
                          <button
                            type='button'
                            onClick={() => setArchiveTarget(c)}
                            className='text-rose-600 hover:underline font-bold cursor-pointer'
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='p-3 border-t border-[#EAE6DF]'>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredContracts.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-2.5'>
              <h3 className='text-sm font-black text-[#1E293B]'>
                {editingContract ? 'Edit Contract' : 'New Contract'}
              </h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 font-bold hover:text-gray-600'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium'>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveContract} className='space-y-3 text-xs'>
              {!editingContract && (
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    <option value=''>Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name} ({emp.employeeCode || emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Salary Structure</label>
                <select
                  value={formData.salaryStructureId}
                  onChange={(e) =>
                    setFormData({ ...formData, salaryStructureId: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  <option value=''>Standard Structure</option>
                  {salaryStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>Monthly Wage (₹) *</label>
                <input
                  type='number'
                  required
                  min='0'
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                />
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>Start Date *</label>
                  <input
                    type='date'
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>End Date</label>
                  <input
                    type='date'
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div className='pt-2 flex justify-end gap-2 border-t border-gray-100'>
                <BackButton label='Cancel' onClick={() => setIsModalOpen(false)} />
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl cursor-pointer ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Terminate Modal */}
      {archiveTarget && (
        <ConfirmDialog
          isOpen={Boolean(archiveTarget)}
          title='Terminate Contract'
          message={`Are you sure you want to terminate/archive the contract for ${archiveTarget.employeeName} (${archiveTarget.contractCode})?`}
          confirmLabel='Terminate'
          isDestructive={true}
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}
    </div>
  );
}
