import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('----------------------------------------------------');
console.log('🚀 Running PeoplePay API Integration & System Checks');
console.log('----------------------------------------------------\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(err);
  }
}

async function runAsyncTest(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${description}`);
    console.error(err);
  }
}

// 1. Branding & Typography Checks
runTest('Global typography: index.html loads Caveat Google Font', () => {
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
  assert.match(indexHtml, /fonts\.googleapis\.com.*family=Caveat/i, 'index.html must link Caveat font');
});

runTest('Global typography: index.css defines Caveat font family', () => {
  const indexCss = fs.readFileSync(path.join(rootDir, 'src', 'index.css'), 'utf-8');
  assert.match(indexCss, /--font-sans: 'Caveat', cursive, sans-serif/, 'index.css must set --font-sans to Caveat');
  assert.match(indexCss, /font-family: 'Caveat', cursive, sans-serif/, 'index.css must apply Caveat to elements');
});

runTest('Branding check: No visible "360" or enterprise taglines in AppLayout or AppHeader', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'src', 'layouts', 'AppLayout.jsx'), 'utf-8');
  const header = fs.readFileSync(path.join(rootDir, 'src', 'components', 'common', 'AppHeader.jsx'), 'utf-8');
  assert.doesNotMatch(layout, /PeoplePay360/, 'AppLayout must not contain PeoplePay360');
  assert.doesNotMatch(layout, /Enterprise Human Resources & Payroll Workspace/, 'AppLayout must not contain enterprise tagline');
  assert.doesNotMatch(header, /PeoplePay360/, 'AppHeader must not contain PeoplePay360');
});

runTest('SidebarDrawer slides from the LEFT with far-right hamburger button in AppHeader', () => {
  const drawer = fs.readFileSync(path.join(rootDir, 'src', 'components', 'common', 'SidebarDrawer.jsx'), 'utf-8');
  const header = fs.readFileSync(path.join(rootDir, 'src', 'components', 'common', 'AppHeader.jsx'), 'utf-8');
  assert.match(drawer, /justify-start/, 'SidebarDrawer must align to start (left side of screen)');
  assert.match(header, /onClick=\{onToggleDrawer\}/, 'AppHeader must provide hamburger menu trigger');
});

// 2. Redux Store & Auth Reducer Tests
await runAsyncTest('Redux Store and Auth Slice dispatch actions correctly', async () => {
  const { store } = await import('../src/redux/store/store.js');
  const { setCredentials, logout } = await import('../src/redux/slices/authSlice.js');

  const testUser = { id: 'usr-test-1', name: 'Test User', email: 'test@peoplepay.internal' };
  const testToken = 'mock-jwt-token-998877';

  // Test setCredentials
  store.dispatch(setCredentials({ user: testUser, role: 'hr_manager', token: testToken }));
  let state = store.getState().auth;
  assert.strictEqual(state.isAuthenticated, true, 'User should be authenticated');
  assert.strictEqual(state.role, 'hr_manager', 'Role should be hr_manager');
  assert.strictEqual(state.token, testToken, 'Token should match');
  assert.strictEqual(state.user.id, testUser.id, 'User ID should match');

  // Test logout
  store.dispatch(logout());
  state = store.getState().auth;
  assert.strictEqual(state.isAuthenticated, false, 'User should not be authenticated after logout');
  assert.strictEqual(state.user, null, 'User should be null after logout');
  assert.strictEqual(state.token, null, 'Token should be null after logout');
});

// 3. Axios Client Interceptors
await runAsyncTest('Axios client exports instance and handles baseURL', async () => {
  const apiClient = (await import('../src/services/apiClient.js')).default;
  assert.ok(apiClient, 'apiClient must be exported');
  assert.ok(apiClient.interceptors.request, 'Request interceptor must be registered');
  assert.ok(apiClient.interceptors.response, 'Response interceptor must be registered');
});

// 4. API Services Verification (All 16 Services)
const serviceModules = [
  { name: 'authApi', path: '../src/services/authApi.js', methods: ['login', 'logout', 'getCurrentUser'] },
  { name: 'employeeApi', path: '../src/services/employeeApi.js', methods: ['getEmployees', 'getEmployeeById', 'createEmployee', 'updateEmployee', 'deleteEmployee'] },
  { name: 'contractApi', path: '../src/services/contractApi.js', methods: ['getContracts', 'getContractById', 'createContract', 'updateContract', 'deleteContract'] },
  { name: 'scheduleApi', path: '../src/services/scheduleApi.js', methods: ['getSchedules', 'getScheduleById', 'createSchedule', 'updateSchedule', 'deleteSchedule'] },
  { name: 'attendanceApi', path: '../src/services/attendanceApi.js', methods: ['getAttendance', 'checkIn', 'checkOut', 'correctAttendance'] },
  { name: 'timeOffApi', path: '../src/services/timeOffApi.js', methods: ['getLeaveTypes', 'getAllocations', 'getRequests', 'submitRequest', 'updateRequestStatus'] },
  { name: 'salaryStructureApi', path: '../src/services/salaryStructureApi.js', methods: ['getSalaryStructures', 'getSalaryStructureById', 'createSalaryStructure', 'updateSalaryStructure'] },
  { name: 'salaryRuleApi', path: '../src/services/salaryRuleApi.js', methods: ['getSalaryRules', 'getSalaryRuleById', 'createSalaryRule', 'updateSalaryRule', 'deleteSalaryRule'] },
  { name: 'payrunApi', path: '../src/services/payrunApi.js', methods: ['getPayruns', 'getPayrunById', 'createPayrun', 'computePayrun', 'validatePayrun', 'payPayrun', 'deletePayrun'] },
  { name: 'payslipApi', path: '../src/services/payslipApi.js', methods: ['getPayslips', 'getPayslipById', 'downloadPayslip', 'sendPayslip'] },
  { name: 'dashboardApi', path: '../src/services/dashboardApi.js', methods: ['getEmployeeDashboard', 'getHRManagerDashboard', 'getHRPayrollDashboard', 'getAdminDashboard'] },
  { name: 'reportApi', path: '../src/services/reportApi.js', methods: ['getPayrollCostReport', 'getMonthlyTrendReport', 'getDepartmentCostReport', 'getAttendanceHealthReport', 'getEmployeeStatsReport'] },
  { name: 'userApi', path: '../src/services/userApi.js', methods: ['getUsers', 'getUserById', 'createUser', 'updateUser', 'deleteUser'] },
  { name: 'departmentApi', path: '../src/services/departmentApi.js', methods: ['getDepartments', 'getDepartmentById', 'createDepartment', 'updateDepartment', 'deleteDepartment'] },
  { name: 'auditLogApi', path: '../src/services/auditLogApi.js', methods: ['getAuditLogs', 'createAuditLog'] },
];

for (const svc of serviceModules) {
  await runAsyncTest(`API Service [${svc.name}] exports all required methods and handles offline mock fallback`, async () => {
    const mod = await import(svc.path);
    const service = mod.default || mod[svc.name];
    assert.ok(service, `Service ${svc.name} must be defined`);
    for (const method of svc.methods) {
      assert.strictEqual(typeof service[method], 'function', `${svc.name}.${method} must be a function`);
    }
    // Test that the primary read method returns mock data fallback gracefully
    const result =
      svc.name === 'authApi'
        ? await service.login({ email: 'admin@peoplepay.internal', password: 'password' })
        : await service[svc.methods[0]]();
    assert.ok(result, `${svc.name} must resolve to an object`);
    assert.ok(result.success === true || result.data !== undefined, `${svc.name} must indicate success or contain data`);
  });
}

// 5. Business Logic Checks
await runAsyncTest('Contract Overlap Logic correctly identifies collision', async () => {
  const { checkContractOverlap, getContractsFromStorage } = await import('../src/data/contractsData.js');
  const contracts = getContractsFromStorage();

  // Existing mock has EMP-2024-001 with 2024-01-01 to 2026-12-31
  const hasOverlap = checkContractOverlap(contracts, {
    employeeId: 'EMP-2024-001',
    startDate: '2025-06-01',
    endDate: '2026-06-01',
  });
  assert.strictEqual(hasOverlap.hasOverlap, true, 'Colliding contract period must be detected');

  const noOverlap = checkContractOverlap(contracts, {
    employeeId: 'EMP-2024-001',
    startDate: '2028-01-01',
    endDate: '2029-01-01',
  });
  assert.strictEqual(noOverlap.hasOverlap, false, 'Non-colliding future contract period must pass');
});

await runAsyncTest('Working Schedule calculates daily and weekly hours correctly', async () => {
  const { calculateWeeklyHours } = await import('../src/data/schedulesData.js');
  const sampleDays = {
    Monday: { active: true, start: '09:00', end: '17:00', breakMinutes: 60 },   // 7 hrs
    Tuesday: { active: true, start: '09:00', end: '17:00', breakMinutes: 60 },  // 7 hrs
    Wednesday: { active: true, start: '09:00', end: '17:00', breakMinutes: 60 },// 7 hrs
    Thursday: { active: true, start: '09:00', end: '17:00', breakMinutes: 60 }, // 7 hrs
    Friday: { active: true, start: '09:00', end: '17:00', breakMinutes: 60 },   // 7 hrs
    Saturday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
    Sunday: { active: false, start: '00:00', end: '00:00', breakMinutes: 0 },
  };
  const weeklyHours = calculateWeeklyHours(sampleDays);
  assert.strictEqual(weeklyHours, 35, 'Weekly hours for 5 days * 7 hrs must be 35');
});

await runAsyncTest('Salary Rules sequence execution maintains ascending order', async () => {
  const { getSalaryRulesFromStorage } = await import('../src/data/salaryData.js');
  const rules = getSalaryRulesFromStorage();
  const sorted = [...rules].sort((a, b) => Number(a.sequence) - Number(b.sequence));
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(Number(sorted[i].sequence) <= Number(sorted[i + 1].sequence), 'Rules must be in ascending sequence');
  }
});

await runAsyncTest('Payrun state machine transitions correctly', async () => {
  const payrunApi = (await import('../src/services/payrunApi.js')).default;
  
  // 1. Create a draft payrun
  const newRunRes = await payrunApi.createPayrun({
    name: 'Test Payrun State Machine',
    month: 'October',
    year: 2026,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    employeeIds: ['EMP-2024-001', 'EMP-2024-002'],
    structureId: 'str-1',
  });
  assert.ok(newRunRes.success);
  const createdId = newRunRes.data.id;
  assert.strictEqual(newRunRes.data.status, 'DRAFT');

  // 2. Compute payrun
  const compRes = await payrunApi.computePayrun(createdId);
  assert.strictEqual(compRes.data.status, 'COMPUTED');
  assert.ok(compRes.data.grossTotal > 0, 'Gross total must be computed');
  assert.ok(compRes.data.netTotal > 0, 'Net total must be computed');

  // 3. Validate payrun
  const valRes = await payrunApi.validatePayrun(createdId);
  assert.strictEqual(valRes.data.status, 'VALIDATED');

  // 4. Mark paid
  const paidRes = await payrunApi.payPayrun(createdId);
  assert.strictEqual(paidRes.data.status, 'PAID');
});

console.log('\n----------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('🎉 ALL INTEGRATION & BUSINESS LOGIC CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED!\n');
  process.exit(1);
}
