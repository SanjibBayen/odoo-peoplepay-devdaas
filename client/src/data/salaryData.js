/**
 * Configurable Salary Rules and Salary Structures for PeoplePay.
 * Business Rule: Rules execute strictly in ascending order of sequence.
 * Formula: rules.sort((a, b) => a.sequence - b.sequence)
 */

export const RULE_TYPES = ['FIXED', 'PERCENTAGE', 'FORMULA', 'TAX'];

export const INITIAL_SALARY_RULES = [
  {
    id: 'rule-1',
    name: 'Basic Salary Component',
    code: 'BASIC',
    sequence: 10,
    type: 'PERCENTAGE',
    percentage: 50,
    amount: null,
    condition: 'contract.wage > 0',
    status: 'Active',
    category: 'Earning',
    description: '50% of gross contract wage',
  },
  {
    id: 'rule-2',
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    sequence: 20,
    type: 'PERCENTAGE',
    percentage: 50,
    amount: null,
    condition: 'BASIC > 0',
    status: 'Active',
    category: 'Earning',
    description: '50% of basic salary',
  },
  {
    id: 'rule-3',
    name: 'Special & Flexible Allowance',
    code: 'SPECIAL_ALW',
    sequence: 30,
    type: 'FORMULA',
    percentage: null,
    amount: null,
    condition: 'true',
    status: 'Active',
    category: 'Earning',
    description: 'Balancing allowance: Wage - (BASIC + HRA)',
  },
  {
    id: 'rule-4',
    name: 'Provident Fund (PF Employee)',
    code: 'PF_EMP',
    sequence: 40,
    type: 'PERCENTAGE',
    percentage: 12,
    amount: null,
    condition: 'BASIC > 0',
    status: 'Active',
    category: 'Deduction',
    description: '12% of basic wage statutory deduction',
  },
  {
    id: 'rule-5',
    name: 'Professional Tax (PT)',
    code: 'PT',
    sequence: 50,
    type: 'FIXED',
    percentage: null,
    amount: 200,
    condition: 'contract.wage > 15000',
    status: 'Active',
    category: 'Deduction',
    description: 'Fixed municipal professional tax',
  },
  {
    id: 'rule-6',
    name: 'Income Tax (TDS / Slab)',
    code: 'TDS',
    sequence: 60,
    type: 'TAX',
    percentage: 10,
    amount: null,
    condition: 'taxableIncome > 50000',
    status: 'Active',
    category: 'Deduction',
    description: 'Slab-computed monthly withholding',
  },
];

export const INITIAL_SALARY_STRUCTURES = [
  {
    id: 'str-1',
    name: 'Standard Tech Engineering Structure',
    code: 'STR-ENG-01',
    description: 'Standard technology workforce pay structure with basic, HRA, and tax deductions.',
    ruleIds: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6'],
    status: 'Active',
    updatedAt: '2026-08-15',
  },
  {
    id: 'str-2',
    name: 'Executive & Operations Structure',
    code: 'STR-EXEC-02',
    description: 'Corporate leadership structure with performance balancing and statutory deductions.',
    ruleIds: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5', 'rule-6'],
    status: 'Active',
    updatedAt: '2026-07-20',
  },
  {
    id: 'str-3',
    name: 'Finance & Support Structure',
    code: 'STR-SUP-03',
    description: 'Administrative structure without complex flexible formula components.',
    ruleIds: ['rule-1', 'rule-2', 'rule-4', 'rule-5'],
    status: 'Active',
    updatedAt: '2026-06-10',
  },
];

const RULES_STORAGE_KEY = 'peoplepay_salary_rules';
const STR_STORAGE_KEY = 'peoplepay_salary_structures';

export function getSalaryRulesFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_SALARY_RULES];
  try {
    const raw = sessionStorage.getItem(RULES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(INITIAL_SALARY_RULES));
  } catch (e) {
    console.error('Failed to read salary rules', e);
  }
  return [...INITIAL_SALARY_RULES];
}

export function saveSalaryRulesToStorage(rules) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save salary rules', e);
    }
  }
}

export function getSalaryStructuresFromStorage() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_SALARY_STRUCTURES];
  try {
    const raw = sessionStorage.getItem(STR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    sessionStorage.setItem(STR_STORAGE_KEY, JSON.stringify(INITIAL_SALARY_STRUCTURES));
  } catch (e) {
    console.error('Failed to read salary structures', e);
  }
  return [...INITIAL_SALARY_STRUCTURES];
}

export function saveSalaryStructuresToStorage(structures) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STR_STORAGE_KEY, JSON.stringify(structures));
    } catch (e) {
      console.error('Failed to save salary structures', e);
    }
  }
}
