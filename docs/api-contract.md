# PeoplePay Authentication API Contract

This document specifies the authentication API contract for PeoplePay between the React frontend and Express backend.

## Base Configuration

- **Backend Base URL**: `http://localhost:5000/api`
- **Transport Security**: HTTP cookies + Bearer Authorization header
- **Axios Configuration**: Requires `withCredentials: true` so the browser sends and receives the `refreshToken` HTTP-only cookie.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Initiates login; issues OTP or tokens |
| `POST` | `/auth/verify-login-otp` | Public | Verifies 6-digit OTP and returns user & accessToken |
| `POST` | `/auth/resend-login-otp` | Public | Resends OTP email |
| `POST` | `/auth/forgot-password` | Public | Requests password reset email |
| `POST` | `/auth/reset-password` | Public | Resets password with token |
| `POST` | `/auth/refresh-token` | Public | Refreshes access token using HTTP-only cookie |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user and permissions |
| `POST` | `/auth/register` | Admin | Creates a new user with assigned roleCodes |
| `POST` | `/auth/register-employee` | Admin/HR | Creates an employee with login account |
| `POST` | `/auth/change-password` | Authenticated | Changes current user's password |
| `POST` | `/auth/logout` | Authenticated | Revokes refresh token and clears session |
| `GET` | `/health` | Public | Health status of API server and database |

---

## Authentication Flow Details

### 1. Login & Two-Factor OTP
- Calling `POST /auth/login` with `{ email, password }` returns `{ otpRequired: true, tempToken, email }`.
- Client redirects to `/login/verify-otp` where user submits the 6-digit code.
- Calling `POST /auth/verify-login-otp` with `{ tempToken, otp }` validates the code and returns `{ accessToken, user: { id, email, fullName, roles, permissions } }`.
- Backend sets HTTP-only `refreshToken` cookie.

### 2. Token Refresh & Persistence
- When an API call returns `401 Unauthorized`, `apiClient` automatically sends `POST /auth/refresh-token` with `withCredentials: true`.
- Backend validates the `refreshToken` cookie and issues a new `accessToken`.
- The failed request is automatically retried with the new token.

### 3. Password Complexity Policy
- All passwords (creation and update) must have:
  - Minimum 8 characters
  - At least 1 uppercase letter (`[A-Z]`)
  - At least 1 lowercase letter (`[a-z]`)
  - At least 1 number (`[0-9]`)
  - At least 1 special character (`[!@#$%^&*(),.?":{}|<>]`)

### 4. Role Codes & RBAC Mapping
- `ADMIN` -> `admin`
- `HR_PAYROLL_MANAGER` -> `hr-payroll-manager`
- `HR_PAYROLL_USER` -> `hr-payroll-user`
- `HR_MANAGER` -> `hr-manager`
- `EMPLOYEE` -> `employee`
