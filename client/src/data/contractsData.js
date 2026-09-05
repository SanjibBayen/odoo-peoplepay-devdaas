/**
 * Mock contracts and overlap validation utilities for PeoplePay.
 * Business Rule: Overlap occurs if startDate <= other.endDate && endDate >= other.startDate.
 */

export const INITIAL_CONTRACTS = [
  {
    id: 'ct-1',
    contractCode: 'CNT-2024-ENG-01',
    employeeId: 'EMP-2024-001',
    employeeName: 'Ayush Sharma',
    department: 'Engineering',
    jobPosition: 'Senior Full Stack Engineer',
    startDate: '2024-03-15',
    endDate: '2026-12-31',
    wage: 140000,
    salaryStructureId: 'str-1',
    salaryStructureName: 'Standard Tech Engineering Structure',
    contractType: 'Permanent',
    status: 'Active',
  },
  {
    id: 'ct-2',
    contractCode: 'CNT-2023-ENG-02',
    employeeId: 'EMP-2023-014',
    employeeName: 'Rahul Verma',
    department: 'Engineering',
    jobPosition: 'Lead DevOps Specialist',
    startDate: '2023-06-01',
    endDate: '2025-12-31',
    wage: 155000,
    salaryStructureId: 'str-1',
    salaryStructureName: 'Standard Tech Engineering Structure',
    contractType: 'Permanent',
    status: 'Active',
  },
  {
    id: 'ct-3',
    contractCode: 'CNT-2022-OPS-01',
    employeeId: 'EMP-2022-089',
    employeeName: 'Priya Sundaram',
    department: 'Operations',
    jobPosition: 'HR Operations Lead',
    startDate: '2022-01-10',
    endDate: '2025-01-09',
    wage: 110000,
    salaryStructureId: 'str-2',
    salaryStructureName: 'Executive & Operations Structure',
    contractType: 'Permanent',
    status: 'Expired',
  },
  {
    id: 'ct-3b',
    contractCode: 'CNT-2025-OPS-01',
    employeeId: 'EMP-2022-089',
    employeeName: 'Priya Sundaram',
    department: 'Operations',
    jobPosition: 'HR Operations Lead',
    startDate: '2025-01-10',
    endDate: '2027-01-09',
    wage: 125000,
    salaryStructureId: 'str-2',
    salaryStructureName: 'Executive & Operations Structure',
    contractType: 'Permanent',
    status: 'Active',
  },
  {
    id: 'ct-4',
    contractCode: 'CNT-2024-MKT-01',
    employeeId: 'EMP-2024-055',
    employeeName: 'Vikram Mehta',
    department: 'Marketing',
    jobPosition: 'Growth & Brand Director',
    startDate: '2024-08-01',
    endDate: '2026-07-31',
    wage: 180000,
    salaryStructureId: 'str-2',
    salaryStructureName: 'Executive & Operations Structure',
    contractType: 'Permanent',
    status: 'Active',
  },
  {
    id: 'ct-5',
    contractCode: 'CNT-2024-FIN-01',
    employeeId: 'EMP-2024-102',
    employeeName: 'Ananya Rao',
    department: 'Finance & Payroll',
    jobPosition: 'Payroll Compliance Analyst',
    startDate: '2024-02-01',
    endDate: '2026-01-31',
    wage: 95000,
    salaryStructureId: 'str-3',
    salaryStructureName: 'Finance & Support Structure',
    contractType: 'Permanent',
    status: 'Active',
  },
];

const STORAGE_KEY = 'peoplepay_contracts_roster';

export function getContractsFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_CONTRACTS];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CONTRACTS));
  } catch (e) {
    console.error('Failed to read contracts', e);
  }
  return [...INITIAL_CONTRACTS];
}

export function saveContractsToStorage(contracts) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    } catch (e) {
      console.error('Failed to save contracts', e);
    }
  }
}

/**
 * Validates whether a given contract date range overlaps with any other active contract for the employee.
 * Overlap formula: (startA <= endB) && (endA >= startB)
 */
export function checkContractOverlap(contracts, newContract) {
  const employeeContracts = contracts.filter(
    (c) =>
      c.employeeId === newContract.employeeId &&
      c.id !== newContract.id &&
      c.status !== 'Archived' &&
      c.status !== 'Cancelled'
  );

  const startA = new Date(newContract.startDate).getTime();
  const endA = newContract.endDate
    ? new Date(newContract.endDate).getTime()
    : new Date('2099-12-31').getTime();

  for (const c of employeeContracts) {
    const startB = new Date(c.startDate).getTime();
    const endB = c.endDate
      ? new Date(c.endDate).getTime()
      : new Date('2099-12-31').getTime();

    if (startA <= endB && endA >= startB) {
      return {
        hasOverlap: true,
        conflictingContract: c,
        message: `Date range overlaps with existing contract ${c.contractCode} (${c.startDate} to ${c.endDate || 'indefinite'}).`,
      };
    }
  }

  return { hasOverlap: false };
}
