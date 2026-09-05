
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- =========================================================
-- ENUM TYPES
-- =========================================================

DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'employee_status'
    ) THEN
        CREATE TYPE employee_status AS ENUM (
            'ACTIVE',
            'INACTIVE',
            'ON_LEAVE',
            'TERMINATED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'contract_status'
    ) THEN
        CREATE TYPE contract_status AS ENUM (
            'DRAFT',
            'ACTIVE',
            'EXPIRED',
            'TERMINATED',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'wage_type'
    ) THEN
        CREATE TYPE wage_type AS ENUM (
            'MONTHLY',
            'ANNUAL',
            'DAILY',
            'HOURLY'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'attendance_status'
    ) THEN
        CREATE TYPE attendance_status AS ENUM (
            'PRESENT',
            'LATE',
            'ABSENT',
            'EARLY_EXIT',
            'OVERTIME',
            'MISSING_CHECKOUT',
            'CORRECTED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'leave_unit'
    ) THEN
        CREATE TYPE leave_unit AS ENUM (
            'DAYS',
            'HOURS'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'time_off_status'
    ) THEN
        CREATE TYPE time_off_status AS ENUM (
            'DRAFT',
            'PENDING',
            'APPROVED',
            'REFUSED',
            'CANCELLED',
            'EXPIRED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'salary_category'
    ) THEN
        CREATE TYPE salary_category AS ENUM (
            'BASIC',
            'ALLOWANCE',
            'GROSS',
            'DEDUCTION',
            'TAX',
            'CONTRIBUTION',
            'NET'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'calculation_type'
    ) THEN
        CREATE TYPE calculation_type AS ENUM (
            'FIXED',
            'PERCENTAGE',
            'FORMULA',
            'TAX'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payrun_status'
    ) THEN
        CREATE TYPE payrun_status AS ENUM (
            'DRAFT',
            'COMPUTING',
            'COMPUTED',
            'VALIDATED',
            'PAID',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payslip_status'
    ) THEN
        CREATE TYPE payslip_status AS ENUM (
            'DRAFT',
            'COMPUTED',
            'VALIDATED',
            'PAID',
            'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'allocation_status'
    ) THEN
        CREATE TYPE allocation_status AS ENUM (
            'DRAFT',
            'PENDING',
            'APPROVED',
            'REFUSED',
            'EXPIRED'
        );
    END IF;

END $$;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- PERMISSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module VARCHAR(100) NOT NULL,

    action VARCHAR(100) NOT NULL,

    UNIQUE(module, action)
);


-- =========================================================
-- USER ROLES
-- =========================================================

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE
);


-- =========================================================
-- ROLE PERMISSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
);


-- =========================================================
-- DEPARTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    manager_id UUID,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- JOB POSITIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    department_id UUID,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_job_position_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL
);


-- =========================================================
-- EMPLOYEE TYPES
-- =========================================================

CREATE TABLE IF NOT EXISTS employee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    code VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WORKING SCHEDULES
-- =========================================================

CREATE TABLE IF NOT EXISTS working_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    schedule_type VARCHAR(50) NOT NULL DEFAULT 'WEEKLY',

    weekly_hours NUMERIC(6,2) NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- SCHEDULE DAYS
-- =========================================================

CREATE TABLE IF NOT EXISTS schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    schedule_id UUID NOT NULL,

    day_of_week INTEGER NOT NULL,

    start_time TIME,

    end_time TIME,

    break_minutes INTEGER NOT NULL DEFAULT 0,

    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_schedule_days_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES working_schedules(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_day_of_week
        CHECK (day_of_week BETWEEN 0 AND 6),

    CONSTRAINT chk_break_minutes
        CHECK (break_minutes >= 0),

    CONSTRAINT chk_schedule_time
        CHECK (
            NOT is_working_day
            OR (
                start_time IS NOT NULL
                AND end_time IS NOT NULL
            )
        ),

    UNIQUE(schedule_id, day_of_week)
);


-- =========================================================
-- EMPLOYEES
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE,

    employee_code VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(30),

    dob DATE,

    joining_date DATE NOT NULL,

    department_id UUID,

    manager_id UUID,

    job_position_id UUID,

    employee_type_id UUID,

    schedule_id UUID,

    status employee_status NOT NULL DEFAULT 'ACTIVE',

    bank_account_number VARCHAR(100),

    bank_name VARCHAR(150),

    ifsc_code VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_employee_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_employee_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_employee_manager
        FOREIGN KEY (manager_id)
        REFERENCES employees(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_employee_job_position
        FOREIGN KEY (job_position_id)
        REFERENCES job_positions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_employee_type
        FOREIGN KEY (employee_type_id)
        REFERENCES employee_types(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_employee_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES working_schedules(id)
        ON DELETE SET NULL
);


-- =========================================================
-- DEPARTMENT MANAGER FK
-- =========================================================

ALTER TABLE departments
DROP CONSTRAINT IF EXISTS fk_department_manager;

ALTER TABLE departments
ADD CONSTRAINT fk_department_manager
FOREIGN KEY (manager_id)
REFERENCES employees(id)
ON DELETE SET NULL;


-- =========================================================
-- SALARY STRUCTURES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- CONTRACTS
-- =========================================================

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,

    contract_number VARCHAR(100) NOT NULL UNIQUE,

    start_date DATE NOT NULL,

    end_date DATE,

    department_id UUID,

    job_position_id UUID,

    schedule_id UUID,

    salary_structure_id UUID,

    wage NUMERIC(15,2) NOT NULL,

    wage_type wage_type NOT NULL DEFAULT 'MONTHLY',

    status contract_status NOT NULL DEFAULT 'DRAFT',

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_contract_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contract_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_contract_position
        FOREIGN KEY (job_position_id)
        REFERENCES job_positions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_contract_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES working_schedules(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_contract_salary_structure
        FOREIGN KEY (salary_structure_id)
        REFERENCES salary_structures(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_contract_dates
        CHECK (
            end_date IS NULL
            OR end_date >= start_date
        ),

    CONSTRAINT chk_contract_wage
        CHECK (wage >= 0)
);


-- =========================================================
-- SALARY RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    category salary_category NOT NULL,

    calculation_type calculation_type NOT NULL,

    sequence INTEGER NOT NULL DEFAULT 10,

    fixed_amount NUMERIC(15,2),

    percentage NUMERIC(8,4),

    base_rule_code VARCHAR(50),

    formula TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_salary_fixed_amount
        CHECK (
            fixed_amount IS NULL
            OR fixed_amount >= 0
        ),

    CONSTRAINT chk_salary_percentage
        CHECK (
            percentage IS NULL
            OR (
                percentage >= 0
                AND percentage <= 100
            )
        )
);


-- =========================================================
-- SALARY STRUCTURE RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_structure_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    salary_structure_id UUID NOT NULL,

    salary_rule_id UUID NOT NULL,

    sequence INTEGER NOT NULL DEFAULT 10,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_structure_rule_structure
        FOREIGN KEY (salary_structure_id)
        REFERENCES salary_structures(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_structure_rule_rule
        FOREIGN KEY (salary_rule_id)
        REFERENCES salary_rules(id)
        ON DELETE CASCADE,

    UNIQUE(salary_structure_id, salary_rule_id)
);


-- =========================================================
-- ATTENDANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,

    work_date DATE NOT NULL,

    check_in TIMESTAMPTZ,

    check_out TIMESTAMPTZ,

    break_minutes INTEGER NOT NULL DEFAULT 0,

    worked_minutes INTEGER NOT NULL DEFAULT 0,

    scheduled_minutes INTEGER NOT NULL DEFAULT 0,

    overtime_minutes INTEGER NOT NULL DEFAULT 0,

    late_minutes INTEGER NOT NULL DEFAULT 0,

    early_exit_minutes INTEGER NOT NULL DEFAULT 0,

    status attendance_status NOT NULL DEFAULT 'PRESENT',

    correction_reason TEXT,

    corrected_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_corrected_by
        FOREIGN KEY (corrected_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_attendance_minutes
        CHECK (
            break_minutes >= 0
            AND worked_minutes >= 0
            AND scheduled_minutes >= 0
            AND overtime_minutes >= 0
            AND late_minutes >= 0
            AND early_exit_minutes >= 0
        ),

    UNIQUE(employee_id, work_date)
);


-- =========================================================
-- TIME OFF TYPES
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    unit leave_unit NOT NULL,

    requires_allocation BOOLEAN NOT NULL DEFAULT TRUE,

    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,

    payroll_integration BOOLEAN NOT NULL DEFAULT TRUE,

    is_paid BOOLEAN NOT NULL DEFAULT TRUE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- TIME OFF ALLOCATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,

    time_off_type_id UUID NOT NULL,

    allocated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    used_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

    valid_from DATE NOT NULL,

    valid_to DATE NOT NULL,

    status allocation_status NOT NULL DEFAULT 'DRAFT',

    approved_by UUID,

    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_allocation_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_allocation_type
        FOREIGN KEY (time_off_type_id)
        REFERENCES time_off_types(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_allocation_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_allocation_amount
        CHECK (
            allocated_amount >= 0
            AND used_amount >= 0
            AND used_amount <= allocated_amount
        ),

    CONSTRAINT chk_allocation_dates
        CHECK (valid_to >= valid_from)
);


-- =========================================================
-- TIME OFF REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id UUID NOT NULL,

    time_off_type_id UUID NOT NULL,

    allocation_id UUID,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    duration NUMERIC(10,2) NOT NULL,

    reason TEXT,

    status time_off_status NOT NULL DEFAULT 'PENDING',

    approved_by UUID,

    approved_at TIMESTAMPTZ,

    refusal_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_timeoff_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_timeoff_type
        FOREIGN KEY (time_off_type_id)
        REFERENCES time_off_types(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_timeoff_allocation
        FOREIGN KEY (allocation_id)
        REFERENCES time_off_allocations(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_timeoff_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_timeoff_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_timeoff_duration
        CHECK (duration > 0)
);


-- =========================================================
-- TAX CONFIGURATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS tax_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    country VARCHAR(100) NOT NULL,

    financial_year VARCHAR(20) NOT NULL,

    regime VARCHAR(100) NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(country, financial_year, regime)
);


-- =========================================================
-- TAX SLABS
-- =========================================================

CREATE TABLE IF NOT EXISTS tax_slabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tax_configuration_id UUID NOT NULL,

    min_income NUMERIC(15,2) NOT NULL,

    max_income NUMERIC(15,2),

    tax_rate NUMERIC(8,4) NOT NULL,

    sequence INTEGER NOT NULL DEFAULT 10,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tax_slab_configuration
        FOREIGN KEY (tax_configuration_id)
        REFERENCES tax_configurations(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_tax_income
        CHECK (
            min_income >= 0
            AND (
                max_income IS NULL
                OR max_income > min_income
            )
        ),

    CONSTRAINT chk_tax_rate
        CHECK (
            tax_rate >= 0
            AND tax_rate <= 100
        )
);


-- =========================================================
-- PAYRUNS
-- =========================================================

CREATE TABLE IF NOT EXISTS payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    salary_structure_id UUID NOT NULL,

    period_start DATE NOT NULL,

    period_end DATE NOT NULL,

    status payrun_status NOT NULL DEFAULT 'DRAFT',

    employee_count INTEGER NOT NULL DEFAULT 0,

    total_gross NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_tax NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_net NUMERIC(18,2) NOT NULL DEFAULT 0,

    created_by UUID NOT NULL,

    computed_at TIMESTAMPTZ,

    validated_at TIMESTAMPTZ,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payrun_structure
        FOREIGN KEY (salary_structure_id)
        REFERENCES salary_structures(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payrun_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_payrun_dates
        CHECK (period_end >= period_start),

    CONSTRAINT chk_payrun_totals
        CHECK (
            employee_count >= 0
            AND total_gross >= 0
            AND total_deductions >= 0
            AND total_tax >= 0
            AND total_net >= 0
        )
);


-- =========================================================
-- PAYRUN EMPLOYEES
-- =========================================================

CREATE TABLE IF NOT EXISTS payrun_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payrun_id UUID NOT NULL,

    employee_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payrun_employee_payrun
        FOREIGN KEY (payrun_id)
        REFERENCES payruns(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payrun_employee_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    UNIQUE(payrun_id, employee_id)
);


-- =========================================================
-- PAYSLIPS
-- =========================================================

CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payslip_number VARCHAR(100) NOT NULL UNIQUE,

    payrun_id UUID NOT NULL,

    employee_id UUID NOT NULL,

    contract_id UUID NOT NULL,

    salary_structure_id UUID NOT NULL,

    period_start DATE NOT NULL,

    period_end DATE NOT NULL,

    worked_days NUMERIC(10,2) NOT NULL DEFAULT 0,

    worked_hours NUMERIC(10,2) NOT NULL DEFAULT 0,

    gross_salary NUMERIC(18,2) NOT NULL DEFAULT 0,

    total_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,

    tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    net_salary NUMERIC(18,2) NOT NULL DEFAULT 0,

    status payslip_status NOT NULL DEFAULT 'DRAFT',

    pdf_url TEXT,

    email_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payslip_payrun
        FOREIGN KEY (payrun_id)
        REFERENCES payruns(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payslip_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payslip_contract
        FOREIGN KEY (contract_id)
        REFERENCES contracts(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payslip_structure
        FOREIGN KEY (salary_structure_id)
        REFERENCES salary_structures(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_payslip_dates
        CHECK (period_end >= period_start),

    CONSTRAINT chk_payslip_amounts
        CHECK (
            worked_days >= 0
            AND worked_hours >= 0
            AND gross_salary >= 0
            AND total_deductions >= 0
            AND tax_amount >= 0
            AND net_salary >= 0
        ),

    UNIQUE(employee_id, payrun_id)
);


-- =========================================================
-- PAYSLIP LINES
-- =========================================================

CREATE TABLE IF NOT EXISTS payslip_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payslip_id UUID NOT NULL,

    salary_rule_id UUID,

    rule_code VARCHAR(50) NOT NULL,

    rule_name VARCHAR(150) NOT NULL,

    category salary_category NOT NULL,

    sequence INTEGER NOT NULL DEFAULT 10,

    base_amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    percentage NUMERIC(8,4),

    amount NUMERIC(18,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payslip_line_payslip
        FOREIGN KEY (payslip_id)
        REFERENCES payslips(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payslip_line_rule
        FOREIGN KEY (salary_rule_id)
        REFERENCES salary_rules(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_payslip_line_amount
        CHECK (
            base_amount >= 0
            AND amount >= 0
        )
);


-- =========================================================
-- PAYROLL WARNINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS payroll_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    payrun_id UUID,

    payslip_id UUID,

    employee_id UUID,

    warning_type VARCHAR(100) NOT NULL,

    severity VARCHAR(30) NOT NULL DEFAULT 'WARNING',

    message TEXT NOT NULL,

    resolved BOOLEAN NOT NULL DEFAULT FALSE,

    resolved_by UUID,

    resolved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_warning_payrun
        FOREIGN KEY (payrun_id)
        REFERENCES payruns(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_warning_payslip
        FOREIGN KEY (payslip_id)
        REFERENCES payslips(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_warning_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_warning_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    action VARCHAR(100) NOT NULL,

    old_values JSONB,

    new_values JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL DEFAULT 'INFO',

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- CONTRACT OVERLAP PROTECTION
-- =========================================================

ALTER TABLE contracts
DROP CONSTRAINT IF EXISTS no_contract_overlap;

ALTER TABLE contracts
ADD CONSTRAINT no_contract_overlap
EXCLUDE USING gist (
    employee_id WITH =,
    daterange(
        start_date,
        COALESCE(end_date + 1, 'infinity'::date),
        '[)'
    ) WITH &&
)
WHERE (
    status IN ('ACTIVE', 'DRAFT')
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_employees_department
ON employees(department_id);

CREATE INDEX IF NOT EXISTS idx_employees_manager
ON employees(manager_id);

CREATE INDEX IF NOT EXISTS idx_employees_status
ON employees(status);

CREATE INDEX IF NOT EXISTS idx_contracts_employee
ON contracts(employee_id);

CREATE INDEX IF NOT EXISTS idx_contracts_dates
ON contracts(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_contracts_status
ON contracts(status);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
ON attendance(employee_id, work_date);

CREATE INDEX IF NOT EXISTS idx_timeoff_employee_dates
ON time_off_requests(employee_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_allocations_employee
ON time_off_allocations(employee_id);

CREATE INDEX IF NOT EXISTS idx_payruns_period
ON payruns(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payrun_employees_payrun
ON payrun_employees(payrun_id);

CREATE INDEX IF NOT EXISTS idx_payrun_employees_employee
ON payrun_employees(employee_id);

CREATE INDEX IF NOT EXISTS idx_payslips_employee
ON payslips(employee_id);

CREATE INDEX IF NOT EXISTS idx_payslips_payrun
ON payslips(payrun_id);

CREATE INDEX IF NOT EXISTS idx_payslip_lines_payslip
ON payslip_lines(payslip_id);

CREATE INDEX IF NOT EXISTS idx_warnings_payrun
ON payroll_warnings(payrun_id);

CREATE INDEX IF NOT EXISTS idx_warnings_employee
ON payroll_warnings(employee_id);

CREATE INDEX IF NOT EXISTS idx_audit_entity
ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id, is_read);


-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_job_positions_updated_at ON job_positions;

CREATE TRIGGER trg_job_positions_updated_at
BEFORE UPDATE ON job_positions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_employee_types_updated_at ON employee_types;

CREATE TRIGGER trg_employee_types_updated_at
BEFORE UPDATE ON employee_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_working_schedules_updated_at ON working_schedules;

CREATE TRIGGER trg_working_schedules_updated_at
BEFORE UPDATE ON working_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_contracts_updated_at ON contracts;

CREATE TRIGGER trg_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_salary_structures_updated_at
ON salary_structures;

CREATE TRIGGER trg_salary_structures_updated_at
BEFORE UPDATE ON salary_structures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_salary_rules_updated_at
ON salary_rules;

CREATE TRIGGER trg_salary_rules_updated_at
BEFORE UPDATE ON salary_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_attendance_updated_at
ON attendance;

CREATE TRIGGER trg_attendance_updated_at
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_time_off_types_updated_at
ON time_off_types;

CREATE TRIGGER trg_time_off_types_updated_at
BEFORE UPDATE ON time_off_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_time_off_allocations_updated_at
ON time_off_allocations;

CREATE TRIGGER trg_time_off_allocations_updated_at
BEFORE UPDATE ON time_off_allocations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_time_off_requests_updated_at
ON time_off_requests;

CREATE TRIGGER trg_time_off_requests_updated_at
BEFORE UPDATE ON time_off_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_tax_configurations_updated_at
ON tax_configurations;

CREATE TRIGGER trg_tax_configurations_updated_at
BEFORE UPDATE ON tax_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_payruns_updated_at
ON payruns;

CREATE TRIGGER trg_payruns_updated_at
BEFORE UPDATE ON payruns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_payslips_updated_at
ON payslips;

CREATE TRIGGER trg_payslips_updated_at
BEFORE UPDATE ON payslips
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- COMPLETE
-- =========================================================

SELECT 'PeoplePay360 database schema created successfully'
AS message;