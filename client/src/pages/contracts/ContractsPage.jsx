import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import contractApi from '../../services/contractApi.js';
import { getContractsFromStorage } from '../../data/contractsData.js';
import { getEmployees } from '../../data/employeeStore.js';
import { getSalaryStructuresFromStorage } from '../../data/salaryData.js';

export default function ContractsPage() {
  const [contracts, setContracts] = useState(() => getContractsFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formError, setFormError] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  // Reference data
  const employees = getEmployees();
  const salaryStructures = getSalaryStructuresFromStorage();

  const [formData, setFormData] = useState({
    employeeId: '',
    jobPosition: '',
    startDate: '',
    endDate: '',
    wage: 100000,
    salaryStructureId: 'str-1',
    contractType: 'Permanent',
    status: 'Active',
  });

  const loadContracts = () => {
    contractApi
      .getContracts()
      .then((res) => {
        setContracts(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch contracts.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleOpenAdd = () => {
    setEditingContract(null);
    setFormError(null);
    setFormData({
      employeeId: employees[0]?.employeeId || 'EMP-2024-001',
      jobPosition: employees[0]?.jobPosition || 'Software Engineer',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-12-31',
      wage: 120000,
      salaryStructureId: salaryStructures[0]?.id || 'str-1',
      contractType: 'Permanent',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contract) => {
    setEditingContract(contract);
    setFormError(null);
    setFormData({
      employeeId: contract.employeeId,
      jobPosition: contract.jobPosition,
      startDate: contract.startDate,
      endDate: contract.endDate || '',
      wage: contract.wage,
      salaryStructureId: contract.salaryStructureId,
      contractType: contract.contractType,
      status: contract.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    setFormError(null);

    const emp = employees.find((x) => x.employeeId === formData.employeeId);
    const struct = salaryStructures.find((s) => s.id === formData.salaryStructureId);

    const payload = {
      ...formData,
      employeeName: emp ? emp.name : 'Employee',
      department: emp ? emp.department : 'General',
      salaryStructureName: struct ? struct.name : 'Standard Structure',
      wage: Number(formData.wage),
    };

    try {
      if (editingContract) {
        await contractApi.updateContract(editingContract.id, payload);
      } else {
        await contractApi.createContract(payload);
      }
      setIsModalOpen(false);
      await loadContracts();
    } catch (err) {
      setFormError(err.message || 'Contract validation failed.');
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    try {
      await contractApi.archiveContract(archiveTarget.id);
      setArchiveTarget(null);
      await loadContracts();
    } catch (err) {
      alert(err.message || 'Failed to archive contract');
    }
  };

  // Filtering
  const filtered = contracts.filter((c) => {
    const matchesStatus =
      selectedStatus === 'All' || c.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.contractCode?.toLowerCase().includes(q) ||
      c.employeeName?.toLowerCase().includes(q) ||
      c.employeeId?.toLowerCase().includes(q) ||
      c.jobPosition?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedContracts = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className='space-y-5'>
      <PageHeader
        title='Contracts'
        subtitle='Workforce contracts, salary structures, and period overlap validation.'
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

      {/* Filter Toolbar */}
      <div className='bg-white p-3 rounded-2xl border border-[#EAE6DF] shadow-2xs flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]'>
          <div className='relative flex-1 max-w-xs'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder='Search by contract code, employee, or ID...'
              className='w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]'
            />
            <span className='absolute left-2.5 top-2 text-gray-400 text-xs'>
              🔍
            </span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className='px-3 py-1.5 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs font-bold text-gray-700 focus:bg-white focus:outline-none'
          >
            <option value='All'>All Statuses</option>
            <option value='Active'>Active</option>
            <option value='Expired'>Expired</option>
            <option value='Archived'>Archived</option>
          </select>
        </div>

        <div className='text-xs font-bold text-gray-500'>
          Showing {filtered.length} contracts
        </div>
      </div>

      {/* Content States */}
      {loading ? (
        <LoadingState message='Loading contracts and validating overlaps...' />
      ) : error ? (
        <ErrorState message={error} onRetry={loadContracts} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No contracts found'
          description='Try adjusting your search query or status filter.'
          action={
            <button
              type='button'
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('All');
              }}
              className='px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold'
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className='bg-white rounded-2xl border border-[#EAE6DF] shadow-2xs overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-[#FAF8F5] border-b border-[#EAE6DF] text-gray-500 font-bold uppercase tracking-wider text-[10px]'>
                <tr>
                  <th className='py-3 px-4'>Contract</th>
                  <th className='py-3 px-4'>Employee</th>
                  <th className='py-3 px-4'>Period</th>
                  <th className='py-3 px-4'>Monthly Wage</th>
                  <th className='py-3 px-4'>Salary Structure</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {paginatedContracts.map((c) => (
                  <tr key={c.id} className='hover:bg-[#FAF8F5]/60 transition-colors'>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-900'>{c.contractCode}</div>
                      <div className='text-[10px] text-gray-400'>{c.contractType}</div>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='font-bold text-gray-800'>{c.employeeName}</div>
                      <div className='text-[10px] text-gray-500'>{c.employeeId} • {c.jobPosition}</div>
                    </td>
                    <td className='py-3 px-4 font-medium text-gray-600'>
                      {c.startDate} &rarr; {c.endDate || 'Indefinite'}
                    </td>
                    <td className='py-3 px-4 font-bold text-gray-900'>
                      ₹{c.wage?.toLocaleString()}
                    </td>
                    <td className='py-3 px-4 text-gray-600'>
                      {c.salaryStructureName}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          c.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'Expired'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-right space-x-2'>
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
                          Archive
                        </button>
                      )}
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
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Contract Modal */}
      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn'
          role='dialog'
          aria-modal='true'
        >
          <div className='bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-[#EAE6DF] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between border-b border-gray-100 pb-3'>
              <h3 className='text-base font-black text-[#1E293B]'>
                {editingContract ? 'Edit Contract' : 'Create New Contract'}
              </h3>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 hover:text-gray-700 cursor-pointer font-bold'
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className='p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold'>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveContract} className='space-y-3.5 text-xs'>
              <div>
                <label className='block font-bold text-gray-700 mb-1'>
                  Employee *
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const emp = employees.find((x) => x.employeeId === e.target.value);
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      jobPosition: emp ? emp.jobPosition : formData.jobPosition,
                    });
                  }}
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5] font-medium'
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId}) • {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Start Date *
                  </label>
                  <input
                    type='date'
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    End Date
                  </label>
                  <input
                    type='date'
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Monthly Wage (INR) *
                  </label>
                  <input
                    type='number'
                    required
                    min='1'
                    value={formData.wage}
                    onChange={(e) =>
                      setFormData({ ...formData, wage: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  />
                </div>
                <div>
                  <label className='block font-bold text-gray-700 mb-1'>
                    Contract Type
                  </label>
                  <select
                    value={formData.contractType}
                    onChange={(e) =>
                      setFormData({ ...formData, contractType: e.target.value })
                    }
                    className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                  >
                    <option value='Permanent'>Permanent</option>
                    <option value='Probation'>Probation</option>
                    <option value='Contract'>Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block font-bold text-gray-700 mb-1'>
                  Salary Structure *
                </label>
                <select
                  value={formData.salaryStructureId}
                  onChange={(e) =>
                    setFormData({ ...formData, salaryStructureId: e.target.value })
                  }
                  className='w-full px-3 py-2 rounded-xl border border-gray-200 bg-[#FAF8F5]'
                >
                  {salaryStructures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className='pt-2 flex items-center justify-end gap-2 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='px-3.5 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 font-bold text-white bg-[#714B67] hover:bg-[#5E3E56] rounded-xl shadow-xs cursor-pointer'
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title='Archive Contract'
        message={`Are you sure you want to archive contract ${archiveTarget?.contractCode}? It will no longer apply to upcoming payruns.`}
        confirmLabel='Archive Contract'
        isDestructive
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
