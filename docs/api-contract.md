# 📄 **PeoplePay Authentication API Contract**

## Base Configuration

- **Backend Base URL**: `http://localhost:3000/api`
- **Frontend Base URL**: `http://localhost:5173`
- **Transport Security**: HTTP cookies + Bearer Authorization header
- **Axios Configuration**: Requires `withCredentials: true` so the browser sends and receives the `refreshToken` HTTP-only cookie.

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Initiates login; verifies password and sends OTP |
| `POST` | `/auth/verify-login-otp` | Public | Verifies 6-digit OTP and returns user & accessToken |
| `POST` | `/auth/resend-login-otp` | Public | Resends OTP email |
| `POST` | `/auth/forgot-password` | Public | Requests password reset OTP |
| `POST` | `/auth/reset-password` | Public | Resets password with OTP |
| `POST` | `/auth/refresh-token` | Public | Refreshes access token using HTTP-only cookie |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user and permissions |
| `POST` | `/auth/register` | Admin | Creates a new user with assigned roleCodes (NO password - magic link sent) |
| `POST` | `/auth/register-employee` | Admin/HR | Creates an employee with login account (NO password - magic link sent) |
| `POST` | `/auth/verify-magic-link` | Public | Verifies magic link token |
| `POST` | `/auth/set-password-magic-link` | Public | Sets password via magic link |
| `POST` | `/auth/resend-magic-link` | Admin/HR | Resends magic link email |
| `POST` | `/auth/change-password` | Authenticated | Changes current user's password |
| `POST` | `/auth/logout` | Authenticated | Revokes refresh token and clears session |
| `GET` | `/health` | Public | Health status of API server and database |

---

## Authentication Flow Details

### 1. Login & Two-Factor OTP

**Step 1: Login**
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@peoplepay.com",
  "password": "User@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password verified. OTP sent to your email",
  "requiresOTP": true,
  "email": "user@peoplepay.com"
}
```

**Step 2: Verify OTP**
```
POST /auth/verify-login-otp
```

**Request:**
```json
{
  "email": "user@peoplepay.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@peoplepay.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "avatarUrl": null,
    "roles": ["ADMIN"],
    "lastLoginAt": "2026-09-05T11:30:00.000Z"
  }
}
```

**Important:**
- Backend sets HTTP-only `refreshToken` cookie
- Frontend stores `token` in memory (Redux) or localStorage
- Frontend stores `user` in Redux

---

### 2. Magic Link Flow (Password Setup)

**Step 1: Admin creates user (NO password)**
```
POST /auth/register
Authorization: Bearer <admin-token>
```

**Request:**
```json
{
  "email": "new.user@peoplepay.com",
  "firstName": "New",
  "lastName": "User",
  "roleCodes": ["EMPLOYEE"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created. Magic link sent for password setup",
  "user": {
    "id": "uuid",
    "email": "new.user@peoplepay.com",
    "firstName": "New",
    "lastName": "User",
    "fullName": "New User",
    "roles": ["EMPLOYEE"],
    "requiresPasswordSetup": true
  }
}
```

**Step 2: User clicks magic link in email**
```
http://localhost:5173/set-password?token=3fbd4475038611153a24d45f19edb4d7c...
```

**Step 3: Verify magic link token**
```
POST /auth/verify-magic-link
```

**Request:**
```json
{
  "token": "3fbd4475038611153a24d45f19edb4d7c..."
}
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "email": "new.user@peoplepay.com",
    "firstName": "New",
    "lastName": "User"
  }
}
```

**Step 4: Set password**
```
POST /auth/set-password-magic-link
```

**Request:**
```json
{
  "token": "3fbd4475038611153a24d45f19edb4d7c...",
  "newPassword": "NewUser@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password set successfully. You can now log in"
}
```

---

### 3. Token Refresh & Persistence

- When an API call returns `401 Unauthorized`, `apiClient` automatically sends `POST /auth/refresh-token` with `withCredentials: true`
- Backend validates the `refreshToken` cookie and issues a new `accessToken`
- The failed request is automatically retried with the new token

**Refresh Token Endpoint:**
```
POST /auth/refresh-token
Cookie: refreshToken=<http-only-cookie>
```

**Response (200):**
```json
{
  "success": true,
  "token": "new-access-token"
}
```

---

### 4. Password Complexity Policy

All passwords must have:
- Minimum **8 characters**
- At least **1 uppercase letter** (`[A-Z]`)
- At least **1 lowercase letter** (`[a-z]`)
- At least **1 number** (`[0-9]`)
- At least **1 special character** (`[!@#$%^&*(),.?":{}|<>]`)

**Valid examples:** `User@123`, `Admin@456`, `Pass@1234`

---

### 5. Role Codes & Frontend Routes

| Role Code | Frontend Route | Dashboard Path |
|-----------|---------------|----------------|
| `ADMIN` | `/admin` | `/admin/dashboard` |
| `HR_PAYROLL_MANAGER` | `/hr-payroll-manager` | `/hr-payroll-manager/dashboard` |
| `HR_PAYROLL_USER` | `/hr-payroll-user` | `/hr-payroll-user/dashboard` |
| `HR_MANAGER` | `/hr-manager` | `/hr-manager/dashboard` |
| `EMPLOYEE` | `/employee` | `/employee/dashboard` |

---

## Complete API Reference

### Public Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@peoplepay.com",
  "password": "User@123"
}
```

#### Verify Login OTP
```http
POST /auth/verify-login-otp
Content-Type: application/json

{
  "email": "user@peoplepay.com",
  "otp": "123456"
}
```

#### Resend Login OTP
```http
POST /auth/resend-login-otp
Content-Type: application/json

{
  "email": "user@peoplepay.com"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@peoplepay.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "user@peoplepay.com",
  "otp": "123456",
  "newPassword": "NewPass@123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Cookie: refreshToken=<http-only-cookie>
```

#### Verify Magic Link
```http
POST /auth/verify-magic-link
Content-Type: application/json

{
  "token": "magic-link-token"
}
```

#### Set Password via Magic Link
```http
POST /auth/set-password-magic-link
Content-Type: application/json

{
  "token": "magic-link-token",
  "newPassword": "User@123"
}
```

#### Health Check
```http
GET /health
```

---

### Authenticated Endpoints (Bearer Token Required)

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@peoplepay.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "avatarUrl": null,
    "isActive": true,
    "lastLoginAt": "2026-09-05T11:30:00.000Z",
    "roles": [
      { "id": "uuid", "name": "Admin", "code": "ADMIN" }
    ],
    "permissions": [
      "employees:read_all",
      "payruns:create",
      "users:manage"
    ]
  }
}
```

#### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

---

### Admin Endpoints

#### Register User (No Password)
```http
POST /auth/register
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "hr.manager@peoplepay.com",
  "firstName": "Sarah",
  "lastName": "Johnson",
  "roleCodes": ["HR_MANAGER"]
}
```

#### Register Employee (No Password)
```http
POST /auth/register-employee
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "alex@peoplepay.com",
  "firstName": "Alex",
  "lastName": "Morgan",
  "employeeCode": "EMP001",
  "phone": "+919876543210",
  "dob": "1998-01-01",
  "gender": "Male",
  "address": "123 Main St",
  "joiningDate": "2026-09-01",
  "departmentId": "uuid",
  "jobPositionId": "uuid",
  "employeeTypeId": "uuid",
  "scheduleId": "uuid",
  "bankAccountNumber": "1234567890",
  "bankName": "HDFC Bank",
  "ifscCode": "HDFC0001234",
  "emergencyContactName": "John Morgan",
  "emergencyContactPhone": "+919876543211",
  "roleCodes": ["EMPLOYEE"]
}
```

#### Resend Magic Link
```http
POST /auth/resend-magic-link
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@peoplepay.com"
}
```

---

## Axios Configuration

```javascript
// apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Important for refreshToken cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "errorCode": "ERROR_CODE"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 401 | `INVALID_TOKEN` | Invalid or expired token |
| 401 | `TOKEN_EXPIRED` | Token has expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 423 | `ACCOUNT_LOCKED` | Account locked due to attempts |
| 429 | `RATE_LIMITED` | Too many requests |

---

## LocalStorage Keys

```javascript
// After login
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));

// On logout
localStorage.removeItem('token');
localStorage.removeItem('user');
```

---

## Role-Based Redirect

```javascript
const getDashboardRoute = (roles) => {
  if (roles.includes('ADMIN')) return '/admin/dashboard';
  if (roles.includes('HR_PAYROLL_MANAGER')) return '/hr-payroll-manager/dashboard';
  if (roles.includes('HR_PAYROLL_USER')) return '/hr-payroll-user/dashboard';
  if (roles.includes('HR_MANAGER')) return '/hr-manager/dashboard';
  if (roles.includes('EMPLOYEE')) return '/employee/dashboard';
  return '/login';
};
```

---