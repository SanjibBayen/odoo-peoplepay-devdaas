# PeoplePay API Contract & Backend Coordination Guide

> **Base URL**: `http://localhost:5000/api` (Configurable via `VITE_API_BASE_URL`)  
> **Auth Scheme**: Bearer JWT (`Authorization: Bearer <token>`)  
> **Target Audience**: Backend Developer & Frontend Team  

This contract documents all 16 frontend API services, their HTTP methods, expected endpoints, payloads, response schemas, and required Role-Based Access Control (RBAC) levels.

---

## 1. Authentication Service (`authApi.js`)

> **Session Architecture**: Access token is passed via `Authorization: Bearer <token>` header. Refresh token is transported via secure HTTP-Only cookie (`refreshToken`) with `sameSite: strict`. Front-end Axios client is configured with `withCredentials: true`.

| Method | Endpoint | Request Body | Response Shape | Required Role / Access |
|---|---|---|---|---|
| `POST` | `/auth/login` | `{ email: string, password: string }` | `{ success: true, message: string, requiresOTP: true }` | Public |
| `POST` | `/auth/verify-login-otp` | `{ email: string, otp: string }` | `{ success: true, message: string, token: string, user: { id, email, fullName, roles: string[] } }` + sets `refreshToken` HTTP-only cookie | Public |
| `POST` | `/auth/resend-login-otp` | `{ email: string }` | `{ success: true, message: string }` | Public |
| `POST` | `/auth/forgot-password` | `{ email: string }` | `{ success: true, message: string }` | Public |
| `POST` | `/auth/reset-password` | `{ email: string, otp: string, newPassword: string }` | `{ success: true, message: string }` | Public |
| `POST` | `/auth/refresh-token` | *None* (Reads HTTP-only `refreshToken` cookie) | `{ success: true, message: string, token: string, user: { id, email, fullName, roles } }` + rotates `refreshToken` cookie | Public / Expired Token Refresh |
| `GET` | `/auth/me` | *None* (`Authorization: Bearer <token>`) | `{ success: true, user: { id, email, fullName, roles: Array<{ id, code, name }> } }` | Authenticated |
| `POST` | `/auth/change-password` | `{ currentPassword: string, newPassword: string }` | `{ success: true, message: "Password changed successfully. Please login again" }` | Authenticated (Destroys sessions) |
| `POST` | `/auth/logout` | *None* (`Authorization: Bearer <token>`) | `{ success: true, message: "Logged out successfully" }` + clears `refreshToken` cookie | Authenticated |
| `POST` | `/auth/register` | `{ email: string, password: string, fullName: string, roleCodes: string[] }` | `{ success: true, message: string, user }` | `admin` |
| `POST` | `/auth/register-employee` | `{ email: string, password: string, firstName: string, lastName: string, departmentId, jobPositionId, ... }` | `{ success: true, message: string, data: { user, employee } }` | `admin` |

### Security & Validation Rules
- **Password Strength**: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (`validatePasswordStrength`).
- **Two-Factor Login**: Credentials verification dispatches a 6-digit OTP stored in Redis with 10-minute expiry. Access token is issued only after `/auth/verify-login-otp`.
- **Silent Token Refresh**: Axios response interceptor intercepts `401 Unauthorized` responses, queues pending requests, requests a new access token via `/auth/refresh-token`, and replays failed requests. If refresh fails, session is destroyed and user is redirected to login.
- **RBAC Role Normalization**: Backend role codes (`EMPLOYEE`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`) are normalized via `mapBackendRole` to frontend route slugs (`employee`, `hr-manager`, `hr-payroll-user`, `hr-payroll-manager`, `admin`).

---

## 2. Employee Management Service (`employeeApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/employees` | `?search=&department=&status=&contract=&page=1&limit=20` | `{ success: true, data: Employee[], total: number, page: number, limit: number }` | `hr_manager`, `admin`, `hr_payroll_manager` |
| `GET` | `/employees/:id` | *None* | `{ success: true, data: Employee }` | `hr_manager`, `admin`, `hr_payroll_manager`, `employee` (self) |
| `POST` | `/employees` | `{ firstName, lastName, email, phone, dateOfBirth, joiningDate, department, jobPosition, status, contractStatus, workLocation, manager, emergencyContact, address }` | `{ success: true, data: Employee }` | `hr_manager`, `admin` |
| `PUT` | `/employees/:id` | `Partial<Employee>` | `{ success: true, data: Employee }` | `hr_manager`, `admin` |
| `DELETE` | `/employees/:id` | *None* | `{ success: true, message: "Employee archived" }` | `hr_manager`, `admin` |

---

## 3. Contract Management Service (`contractApi.js`)

*Business Rule: Period Overlap Validation (`startDate <= periodEnd && endDate >= periodStart`). Overlapping active contracts for the same employee are strictly prohibited.*

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/contracts` | `?employeeId=&status=&page=1&limit=20` | `{ success: true, data: Contract[], total: number }` | `hr_manager`, `admin`, `employee` (self) |
| `GET` | `/contracts/:id` | *None* | `{ success: true, data: Contract }` | `hr_manager`, `admin`, `employee` (self) |
| `POST` | `/contracts` | `{ employeeId, employeeName, jobPosition, department, startDate, endDate, wage, salaryStructureId, salaryStructureName, contractType, status }` | `{ success: true, data: Contract }` | `hr_manager`, `admin` |
| `PUT` | `/contracts/:id` | `Partial<Contract>` | `{ success: true, data: Contract }` | `hr_manager`, `admin` |
| `PATCH` | `/contracts/:id/archive` | *None* | `{ success: true, message: "Contract archived", data: Contract }` | `hr_manager`, `admin` |

---

## 4. Working Schedule Service (`scheduleApi.js`)

*Business Rule: `Worked Hours = End - Start - Break`. `Weekly Hours = sum of daily working hours`.*

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/schedules` | *None* | `{ success: true, data: Schedule[] }` | `hr_manager`, `admin` |
| `GET` | `/schedules/:id` | *None* | `{ success: true, data: Schedule }` | `hr_manager`, `admin` |
| `POST` | `/schedules` | `{ name, code, description, days: { [day]: { active: boolean, start: string, end: string, breakMinutes: number } } }` | `{ success: true, data: Schedule }` | `hr_manager`, `admin` |
| `PUT` | `/schedules/:id` | `Partial<Schedule>` | `{ success: true, data: Schedule }` | `hr_manager`, `admin` |

---

## 5. Attendance Service (`attendanceApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/attendance` | `?employeeId=&date=&status=&page=1&limit=20` | `{ success: true, data: AttendanceRecord[], total: number }` | `employee`, `hr_manager`, `hr_payroll_user`, `admin` |
| `GET` | `/attendance/employee/:id` | `?startDate=&endDate=` | `{ success: true, data: AttendanceRecord[] }` | `employee` (self), `hr_manager`, `hr_payroll_user` |
| `POST` | `/attendance/check-in` | `{ employeeId, checkInTime, notes }` | `{ success: true, data: AttendanceRecord }` | `employee`, `hr_manager` |
| `POST` | `/attendance/check-out` | `{ attendanceId, checkOutTime, notes }` | `{ success: true, data: AttendanceRecord }` | `employee`, `hr_manager` |
| `PUT` | `/attendance/:id` | `{ checkIn, checkOut, status, notes }` | `{ success: true, data: AttendanceRecord }` | `hr_manager`, `hr_payroll_user`, `admin` |

---

## 6. Time Off Service (`timeOffApi.js`)

*Business Rule: `Remaining = Allocation - Approved Used`. Pending requests do not consume balance until approved.*

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/time-off/leave-types` | *None* | `{ success: true, data: LeaveType[] }` | All Roles |
| `GET` | `/time-off/allocations` | `?employeeId=` | `{ success: true, data: LeaveAllocation[] }` | All Roles |
| `GET` | `/time-off/requests` | `?employeeId=&status=&page=1&limit=20` | `{ success: true, data: LeaveRequest[], total: number }` | All Roles |
| `POST` | `/time-off/requests` | `{ employeeId, leaveTypeId, startDate, endDate, days, reason }` | `{ success: true, data: LeaveRequest }` | `employee`, `hr_manager` |
| `PATCH` | `/time-off/requests/:id/approve` | `{ reviewNotes }` | `{ success: true, data: LeaveRequest }` | `hr_manager`, `admin` |
| `PATCH` | `/time-off/requests/:id/reject` | `{ reason }` | `{ success: true, data: LeaveRequest }` | `hr_manager`, `admin` |

---

## 7. Salary Structure Service (`salaryStructureApi.js`)

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/salary-structures` | *None* | `{ success: true, data: SalaryStructure[] }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `GET` | `/salary-structures/:id` | *None* | `{ success: true, data: SalaryStructure }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `POST` | `/salary-structures` | `{ name, code, description, ruleIds: string[], status }` | `{ success: true, data: SalaryStructure }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `PUT` | `/salary-structures/:id` | `Partial<SalaryStructure>` | `{ success: true, data: SalaryStructure }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |

---

## 8. Salary Rule Service (`salaryRuleApi.js`)

*Business Rule: Rules MUST execute in ascending order of `sequence` (`rules.sort((a,b) => a.sequence - b.sequence)`).*

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/salary-rules` | *None* | `{ success: true, data: SalaryRule[] }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `GET` | `/salary-rules/:id` | *None* | `{ success: true, data: SalaryRule }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `POST` | `/salary-rules` | `{ name, code, sequence: number, type: 'FIXED'\|'PERCENTAGE'\|'FORMULA'\|'TAX', amount, percentage, condition, status }` | `{ success: true, data: SalaryRule }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `PUT` | `/salary-rules/:id` | `Partial<SalaryRule>` | `{ success: true, data: SalaryRule }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |

---

## 9. Payrun Service (`payrunApi.js`)

*Lifecycle: `DRAFT` &rarr; `COMPUTED` &rarr; `VALIDATED` &rarr; `PAID`.*

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/payruns` | `?status=&period=&page=1&limit=20` | `{ success: true, data: Payrun[], total: number }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `GET` | `/payruns/:id` | *None* | `{ success: true, data: PayrunDetail }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `POST` | `/payruns` | `{ name, structureId, period: { month, year, startDate, endDate }, employeeIds: string[] }` | `{ success: true, data: Payrun }` | `hr_payroll_user`, `hr_payroll_manager` |
| `POST` | `/payruns/:id/compute` | *None* | `{ success: true, data: Payrun }` | `hr_payroll_user`, `hr_payroll_manager` |
| `POST` | `/payruns/:id/validate` | *None* | `{ success: true, data: Payrun }` | `hr_payroll_manager`, `admin` |
| `POST` | `/payruns/:id/mark-paid` | `{ paymentReference, paymentDate }` | `{ success: true, data: Payrun }` | `hr_payroll_manager`, `admin` |
| `POST` | `/payruns/:id/send-payslips` | *None* | `{ success: true, message: "Payslips sent to employees" }` | `hr_payroll_manager`, `admin` |

---

## 10. Payslip Service (`payslipApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/payslips` | `?employeeId=&period=&status=&page=1&limit=20` | `{ success: true, data: Payslip[], total: number }` | `employee` (self), `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `GET` | `/payslips/:id` | *None* | `{ success: true, data: PayslipDetail }` | `employee` (self), `hr_payroll_user`, `hr_payroll_manager`, `admin` |
| `GET` | `/payslips/:id/download` | *None* | PDF / JSON Blob stream | All Roles |
| `POST` | `/payslips/:id/send` | *None* | `{ success: true, message: "Payslip sent" }` | `hr_payroll_user`, `hr_payroll_manager`, `admin` |

---

## 11. Dashboard Service (`dashboardApi.js`)

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/dashboard/employee` | *None* | `{ success: true, data: EmployeeDashboardData }` | `employee` |
| `GET` | `/dashboard/hr-manager` | *None* | `{ success: true, data: HRManagerDashboardData }` | `hr_manager` |
| `GET` | `/dashboard/payroll-user` | *None* | `{ success: true, data: HRPayrollUserData }` | `hr_payroll_user` |
| `GET` | `/dashboard/payroll-manager` | *None* | `{ success: true, data: HRPayrollManagerData }` | `hr_payroll_manager` |
| `GET` | `/dashboard/admin` | *None* | `{ success: true, data: AdminDashboardData }` | `admin` |

---

## 12. Reports Service (`reportApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/reports/payroll-cost` | `?year=2026` | `{ success: true, data: PayrollCostReport }` | `hr_manager`, `hr_payroll_manager`, `admin` |
| `GET` | `/reports/monthly-trend` | `?months=6` | `{ success: true, data: MonthlyTrendItem[] }` | `hr_manager`, `hr_payroll_manager`, `admin` |
| `GET` | `/reports/department-cost` | `?month=09&year=2026` | `{ success: true, data: DeptCostItem[] }` | `hr_manager`, `hr_payroll_manager`, `admin` |
| `GET` | `/reports/attendance-health`| `?month=09&year=2026` | `{ success: true, data: AttendanceHealthData }` | `hr_manager`, `admin` |
| `GET` | `/reports/employee-stats` | *None* | `{ success: true, data: EmployeeStatsData }` | `hr_manager`, `admin` |

---

## 13. User Management Service (`userApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/users` | `?role=&status=&search=&page=1&limit=20` | `{ success: true, data: User[], total: number }` | `admin` |
| `GET` | `/users/:id` | *None* | `{ success: true, data: User }` | `admin` |
| `POST` | `/users` | `{ name, email, role, status, department }` | `{ success: true, data: User }` | `admin` |
| `PUT` | `/users/:id` | `Partial<User>` | `{ success: true, data: User }` | `admin` |
| `DELETE` | `/users/:id` | *None* | `{ success: true, message: "User deleted" }` | `admin` |

---

## 14. Department Service (`departmentApi.js`)

| Method | Endpoint | Request Body | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/departments` | *None* | `{ success: true, data: Department[] }` | `admin`, `hr_manager` |
| `GET` | `/departments/:id` | *None* | `{ success: true, data: Department }` | `admin`, `hr_manager` |
| `POST` | `/departments` | `{ name, code, managerName, budget }` | `{ success: true, data: Department }` | `admin` |
| `PUT` | `/departments/:id` | `Partial<Department>` | `{ success: true, data: Department }` | `admin` |

---

## 15. Audit Log Service (`auditLogApi.js`)

| Method | Endpoint | Request Body / Query | Response Shape | Required Role |
|---|---|---|---|---|
| `GET` | `/audit-logs` | `?module=&action=&startDate=&endDate=&page=1&limit=25` | `{ success: true, data: AuditLogItem[], total: number }` | `admin` |

---

## 16. Error & Status Code Conventions

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (e.g. overlapping contract, insufficient leave balance).
- `401 Unauthorized`: Token missing, expired, or invalid.
- `403 Forbidden`: Authenticated user lacks RBAC permission for endpoint.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Business rule violation (e.g. duplicate code or payrun in progress).
- `500 Server Error`: Unhandled server exception.
