import { INITIAL_EMPLOYEES } from './employees.js';

const STORAGE_KEY = 'peoplepay_employees_roster';

export function getEmployees() {
  if (typeof sessionStorage === 'undefined') return [...INITIAL_EMPLOYEES];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read employees from sessionStorage', e);
  }
  // Initialize with initial mock data
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EMPLOYEES));
  } catch (e) {
    console.error('Failed to set employees in sessionStorage', e);
  }
  return [...INITIAL_EMPLOYEES];
}

export function getEmployeeById(identifier) {
  const all = getEmployees();
  return (
    all.find(
      (emp) =>
        emp.id === identifier ||
        emp.employeeId?.toLowerCase() === identifier?.toLowerCase()
    ) || null
  );
}

export function saveEmployee(employee) {
  const all = getEmployees();
  const index = all.findIndex(
    (e) =>
      (employee.id && e.id === employee.id) ||
      (employee.employeeId && e.employeeId === employee.employeeId)
  );

  const fullName =
    employee.name ||
    `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  const avatar =
    employee.avatar ||
    `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() ||
    'EP';
  const employeeId =
    employee.employeeId ||
    `EMP-2025-${String(Math.floor(Math.random() * 900) + 100)}`;
  const id = employee.id || `emp-${Date.now()}`;

  const normalized = {
    ...employee,
    id,
    employeeId,
    name: fullName,
    avatar,
  };

  let updated;
  if (index >= 0) {
    updated = [...all];
    updated[index] = { ...all[index], ...normalized };
  } else {
    updated = [normalized, ...all];
  }

  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save employees to sessionStorage', e);
    }
  }
  return updated;
}
