CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- =========================================================
-- ENUM TYPES
-- =========================================================

DO $$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_status') THEN
        CREATE TYPE employee_status AS ENUM (
            'ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
        CREATE TYPE contract_status AS ENUM (
            'DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'wage_type') THEN
        CREATE TYPE wage_type AS ENUM ('MONTHLY', 'ANNUAL', 'DAILY', 'HOURLY');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE attendance_status AS ENUM (
            'PRESENT', 'LATE', 'ABSENT', 'EARLY_EXIT',
            'OVERTIME', 'MISSING_CHECKOUT', 'CORRECTED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_unit') THEN
        CREATE TYPE leave_unit AS ENUM ('DAYS', 'HOURS');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_off_status') THEN
        CREATE TYPE time_off_status AS ENUM (
            'DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'CANCELLED', 'EXPIRED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salary_category') THEN
        CREATE TYPE salary_category AS ENUM (
            'BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION',
            'TAX', 'CONTRIBUTION', 'NET'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calculation_type') THEN
        CREATE TYPE calculation_type AS ENUM (
            'FIXED', 'PERCENTAGE', 'FORMULA', 'TAX'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payrun_status') THEN
        CREATE TYPE payrun_status AS ENUM (
            'DRAFT', 'COMPUTING', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payslip_status') THEN
        CREATE TYPE payslip_status AS ENUM (
            'DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'allocation_status') THEN
        CREATE TYPE allocation_status AS ENUM (
            'DRAFT', 'PENDING', 'APPROVED', 'REFUSED', 'EXPIRED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE schedule_type AS ENUM ('WEEKLY', 'FLEXIBLE', 'SHIFT');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'warning_severity') THEN
        CREATE TYPE warning_severity AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_mode') THEN
        CREATE TYPE approval_mode AS ENUM (
            'NO_APPROVAL', 'MANAGER_APPROVAL', 'HR_APPROVAL', 'BOTH_APPROVAL'
        );
    END IF;

END $$;


-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                    VARCHAR(255) NOT NULL UNIQUE,
    password_hash            TEXT NOT NULL,
    first_name               VARCHAR(100),
    last_name                VARCHAR(100),
    avatar_url               TEXT,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at            TIMESTAMPTZ,
    password_reset_token     TEXT,
    password_reset_expires   TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, code, description) VALUES
    ('Employee',           'EMPLOYEE',           'Basic employee – view own records, submit attendance and leave'),
    ('HR Manager',         'HR_MANAGER',         'Full HR CRUD; approve/refuse time-off; no payroll access'),
    ('HR Payroll User',    'HR_PAYROLL_USER',    'HR Manager + CRU on Payruns & Payslips; read-only Salary config'),
    ('HR Payroll Manager', 'HR_PAYROLL_MANAGER', 'Full HR & Payroll CRUD including Salary Structures & Rules'),
    ('Admin',              'ADMIN',              'Full system access + user management')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- PERMISSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module      VARCHAR(100) NOT NULL,
    action      VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

INSERT INTO permissions (module, action, description) VALUES
    ('employees','read_own','View own employee profile'),
    ('employees','read_all','View all employee profiles'),
    ('employees','create','Create employee records'),
    ('employees','update','Update employee records'),
    ('employees','delete','Delete employee records'),
    ('contracts','read_own','View own contracts'),
    ('contracts','read_all','View all contracts'),
    ('contracts','create','Create contracts'),
    ('contracts','update','Update contracts'),
    ('contracts','delete','Delete contracts'),
    ('attendance','read_own','View own attendance'),
    ('attendance','read_all','View all attendance records'),
    ('attendance','create','Create attendance entries'),
    ('attendance','update','Correct attendance records'),
    ('attendance','delete','Delete attendance records'),
    ('time_off_types','read','View time-off types'),
    ('time_off_types','create','Create time-off types'),
    ('time_off_types','update','Update time-off types'),
    ('time_off_types','delete','Delete time-off types'),
    ('time_off_allocations','read_own','View own allocations'),
    ('time_off_allocations','read_all','View all allocations'),
    ('time_off_allocations','create','Create allocations'),
    ('time_off_allocations','approve','Approve/refuse allocations'),
    ('time_off_allocations','delete','Delete allocations'),
    ('time_off_requests','read_own','View own leave requests'),
    ('time_off_requests','read_all','View all leave requests'),
    ('time_off_requests','create','Submit leave requests'),
    ('time_off_requests','approve','Approve/refuse leave requests'),
    ('time_off_requests','delete','Delete leave requests'),
    ('working_schedules','read','View working schedules'),
    ('working_schedules','create','Create working schedules'),
    ('working_schedules','update','Update working schedules'),
    ('working_schedules','delete','Delete working schedules'),
    ('salary_structures','read','View salary structures'),
    ('salary_structures','create','Create salary structures'),
    ('salary_structures','update','Update salary structures'),
    ('salary_structures','delete','Delete salary structures'),
    ('salary_rules','read','View salary rules'),
    ('salary_rules','create','Create salary rules'),
    ('salary_rules','update','Update salary rules'),
    ('salary_rules','delete','Delete salary rules'),
    ('payruns','read','View payruns'),
    ('payruns','create','Create payruns'),
    ('payruns','update','Update payruns'),
    ('payruns','validate','Validate payruns'),
    ('payruns','delete','Delete payruns'),
    ('payslips','read_own','View own payslips'),
    ('payslips','read_all','View all payslips'),
    ('payslips','create','Create payslips'),
    ('payslips','update','Update payslips'),
    ('payslips','delete','Delete payslips'),
    ('payslips','send_email','Send payslips by email'),
    ('reports','read','Access payroll dashboard and reports'),
    ('users','manage','Full user and role management')
ON CONFLICT (module, action) DO NOTHING;


-- =========================================================
-- ROLE PERMISSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_rp_role
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

DO $$
DECLARE
    r_emp  UUID; r_hrm UUID; r_hpu UUID; r_hpm UUID; r_adm UUID;
BEGIN
    SELECT id INTO r_emp FROM roles WHERE code = 'EMPLOYEE';
    SELECT id INTO r_hrm FROM roles WHERE code = 'HR_MANAGER';
    SELECT id INTO r_hpu FROM roles WHERE code = 'HR_PAYROLL_USER';
    SELECT id INTO r_hpm FROM roles WHERE code = 'HR_PAYROLL_MANAGER';
    SELECT id INTO r_adm FROM roles WHERE code = 'ADMIN';

    -- EMPLOYEE
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_emp, id FROM permissions WHERE (module, action) IN (
        ('employees','read_own'),
        ('attendance','read_own'), ('attendance','create'),
        ('time_off_requests','read_own'), ('time_off_requests','create'),
        ('time_off_allocations','read_own'),
        ('payslips','read_own')
    ) ON CONFLICT DO NOTHING;

    -- HR MANAGER
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_hrm, id FROM permissions WHERE
        module IN ('employees','contracts','attendance','time_off_types',
                   'time_off_allocations','time_off_requests','working_schedules')
        OR (module = 'reports' AND action = 'read')
    ON CONFLICT DO NOTHING;

    -- HR PAYROLL USER
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_hpu, id FROM permissions WHERE
        module IN ('employees','contracts','attendance','time_off_types',
                   'time_off_allocations','time_off_requests','working_schedules')
        OR (module = 'salary_structures' AND action = 'read')
        OR (module = 'salary_rules'      AND action = 'read')
        OR (module = 'payruns'    AND action IN ('read','create','update','validate'))
        OR (module = 'payslips'   AND action IN ('read_own','read_all','create','update','send_email'))
        OR (module = 'reports'    AND action = 'read')
    ON CONFLICT DO NOTHING;

    -- HR PAYROLL MANAGER
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_hpm, id FROM permissions WHERE module <> 'users'
    ON CONFLICT DO NOTHING;

    -- ADMIN
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r_adm, id FROM permissions ON CONFLICT DO NOTHING;
END $$;


-- =========================================================
-- USER ROLES
-- =========================================================

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id)  REFERENCES roles(id) ON DELETE CASCADE
);


-- =========================================================
-- DEPARTMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    manager_id  UUID,
    parent_id   UUID,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO departments (name, code, description) VALUES
    ('Human Resources', 'HR',    'HR and People Operations'),
    ('Engineering',     'ENG',   'Software Engineering'),
    ('Finance',         'FIN',   'Finance and Accounting'),
    ('Sales',           'SALES', 'Sales and Business Development'),
    ('Operations',      'OPS',   'Business Operations'),
    ('Marketing',       'MKT',   'Marketing and Communications'),
    ('Administration',  'ADMIN', 'General Administration')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- JOB POSITIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS job_positions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    code          VARCHAR(50)  NOT NULL UNIQUE,
    description   TEXT,
    department_id UUID,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_jp_dept
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

INSERT INTO job_positions (name, code, department_id) VALUES
    ('HR Manager',               'HR_MGR',   (SELECT id FROM departments WHERE code = 'HR')),
    ('HR Executive',             'HR_EXEC',  (SELECT id FROM departments WHERE code = 'HR')),
    ('Payroll Specialist',       'PAY_SPEC', (SELECT id FROM departments WHERE code = 'HR')),
    ('Software Engineer',        'SWE',      (SELECT id FROM departments WHERE code = 'ENG')),
    ('Senior Software Engineer', 'SR_SWE',   (SELECT id FROM departments WHERE code = 'ENG')),
    ('Engineering Manager',      'ENG_MGR',  (SELECT id FROM departments WHERE code = 'ENG')),
    ('Finance Manager',          'FIN_MGR',  (SELECT id FROM departments WHERE code = 'FIN')),
    ('Accountant',               'ACCT',     (SELECT id FROM departments WHERE code = 'FIN')),
    ('Sales Executive',          'SALES_EX', (SELECT id FROM departments WHERE code = 'SALES')),
    ('Operations Manager',       'OPS_MGR',  (SELECT id FROM departments WHERE code = 'OPS')),
    ('System Administrator',     'SYS_ADMIN',(SELECT id FROM departments WHERE code = 'ADMIN'))
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- EMPLOYEE TYPES
-- =========================================================

CREATE TABLE IF NOT EXISTS employee_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO employee_types (name, code, description) VALUES
    ('Full-Time',  'FT',      'Permanent full-time employee'),
    ('Part-Time',  'PT',      'Part-time employee'),
    ('Contract',   'CONTRACT','Fixed-term contract employee'),
    ('Intern',     'INTERN',  'Internship / Trainee'),
    ('Consultant', 'CONSULT', 'External consultant')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- WORKING SCHEDULES
-- =========================================================

CREATE TABLE IF NOT EXISTS working_schedules (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    code          VARCHAR(50)  NOT NULL UNIQUE,
    schedule_type schedule_type NOT NULL DEFAULT 'WEEKLY',
    weekly_hours  NUMERIC(6,2) NOT NULL DEFAULT 0,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO working_schedules (name, code, schedule_type, weekly_hours) VALUES
    ('Standard 40h (Mon-Fri)', 'STD_40',  'WEEKLY',   40.00),
    ('Flexible 40h',           'FLEX_40', 'FLEXIBLE',  40.00),
    ('Part-Time 20h',          'PT_20',   'WEEKLY',   20.00),
    ('Night Shift',            'NIGHT',   'SHIFT',    40.00)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- SCHEDULE DAYS
-- =========================================================

CREATE TABLE IF NOT EXISTS schedule_days (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id    UUID NOT NULL,
    day_of_week    INTEGER NOT NULL,
    start_time     TIME,
    end_time       TIME,
    break_minutes  INTEGER NOT NULL DEFAULT 0,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sd_schedule
        FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE CASCADE,
    CONSTRAINT chk_sd_dow   CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_sd_break CHECK (break_minutes >= 0),
    CONSTRAINT chk_sd_times CHECK (NOT is_working_day OR (start_time IS NOT NULL AND end_time IS NOT NULL)),
    UNIQUE(schedule_id, day_of_week)
);

DO $$
DECLARE v_sid UUID;
BEGIN
    SELECT id INTO v_sid FROM working_schedules WHERE code = 'STD_40';
    INSERT INTO schedule_days (schedule_id, day_of_week, start_time, end_time, break_minutes, is_working_day) VALUES
        (v_sid, 0, NULL,    NULL,    0,  FALSE),
        (v_sid, 1, '09:00', '18:00', 60, TRUE),
        (v_sid, 2, '09:00', '18:00', 60, TRUE),
        (v_sid, 3, '09:00', '18:00', 60, TRUE),
        (v_sid, 4, '09:00', '18:00', 60, TRUE),
        (v_sid, 5, '09:00', '18:00', 60, TRUE),
        (v_sid, 6, NULL,    NULL,    0,  FALSE)
    ON CONFLICT (schedule_id, day_of_week) DO NOTHING;
END $$;


-- =========================================================
-- EMPLOYEES  (central hub)
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID UNIQUE,
    employee_code            VARCHAR(50) NOT NULL UNIQUE,
    first_name               VARCHAR(100) NOT NULL,
    last_name                VARCHAR(100),
    email                    VARCHAR(255) NOT NULL UNIQUE,
    phone                    VARCHAR(30),
    dob                      DATE,
    gender                   VARCHAR(20),
    address                  TEXT,
    joining_date             DATE NOT NULL,
    leaving_date             DATE,
    department_id            UUID,
    manager_id               UUID,
    job_position_id          UUID,
    employee_type_id         UUID,
    schedule_id              UUID,
    status                   employee_status NOT NULL DEFAULT 'ACTIVE',
    bank_account_number      VARCHAR(100),
    bank_name                VARCHAR(150),
    ifsc_code                VARCHAR(50),
    avatar_url               TEXT,
    emergency_contact_name   VARCHAR(150),
    emergency_contact_phone  VARCHAR(30),
    notes                    TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_emp_user
        FOREIGN KEY (user_id)          REFERENCES users(id)              ON DELETE SET NULL,
    CONSTRAINT fk_emp_department
        FOREIGN KEY (department_id)    REFERENCES departments(id)        ON DELETE SET NULL,
    CONSTRAINT fk_emp_manager
        FOREIGN KEY (manager_id)       REFERENCES employees(id)          ON DELETE SET NULL,
    CONSTRAINT fk_emp_job_position
        FOREIGN KEY (job_position_id)  REFERENCES job_positions(id)      ON DELETE SET NULL,
    CONSTRAINT fk_emp_type
        FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)     ON DELETE SET NULL,
    CONSTRAINT fk_emp_schedule
        FOREIGN KEY (schedule_id)      REFERENCES working_schedules(id)  ON DELETE SET NULL,
    CONSTRAINT chk_emp_leaving
        CHECK (leaving_date IS NULL OR leaving_date >= joining_date)
);


-- =========================================================
-- DEPARTMENT MANAGER / PARENT FKs  (deferred)
-- =========================================================

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_dept_manager;
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_dept_parent;
ALTER TABLE departments ADD CONSTRAINT fk_dept_parent
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL;


-- =========================================================
-- SALARY STRUCTURES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_structures (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO salary_structures (name, code, description) VALUES
    ('Regular Monthly Salary', 'REG_MONTHLY',  'Standard monthly payroll for full-time employees'),
    ('Part-Time Hourly',       'PT_HOURLY',    'Part-time / hourly-rate payroll'),
    ('Contract Staff Salary',  'CONTRACT_SAL', 'Fixed-term contract employee structure'),
    ('Intern Stipend',         'INTERN_STIP',  'Monthly stipend structure for interns')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- SALARY RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_rules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(150) NOT NULL,
    code              VARCHAR(50)  NOT NULL UNIQUE,
    description       TEXT,
    category          salary_category   NOT NULL,
    calculation_type  calculation_type  NOT NULL,
    sequence          INTEGER NOT NULL DEFAULT 10,
    fixed_amount      NUMERIC(15,2),
    percentage        NUMERIC(8,4),
    base_rule_code    VARCHAR(50),
    formula           TEXT,
    condition_formula TEXT,
    active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sr_fixed CHECK (fixed_amount IS NULL OR fixed_amount >= 0),
    CONSTRAINT chk_sr_pct   CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

INSERT INTO salary_rules (name, code, description, category, calculation_type, sequence, fixed_amount, percentage, base_rule_code, formula) VALUES
    ('Basic Salary',         'BASIC',      'Base monthly wage from contract',              'BASIC',       'FORMULA',     10, NULL,    NULL, NULL,    'contract.wage'),
    ('House Rent Allowance', 'HRA',        '40% of Basic Salary',                         'ALLOWANCE',   'PERCENTAGE',  20, NULL,    40.0, 'BASIC', NULL),
    ('Transport Allowance',  'TA',         'Fixed transport allowance',                   'ALLOWANCE',   'FIXED',       30, 2000.00, NULL, NULL,    NULL),
    ('Special Allowance',    'SA',         'Discretionary special allowance',             'ALLOWANCE',   'FIXED',       40, 1000.00, NULL, NULL,    NULL),
    ('Gross Salary',         'GROSS',      'Basic + All Allowances',                      'GROSS',       'FORMULA',     50, NULL,    NULL, NULL,    'BASIC + HRA + TA + SA'),
    ('Provident Fund',       'PF',         '12% of Basic (employee contribution)',        'CONTRIBUTION','PERCENTAGE',  60, NULL,    12.0, 'BASIC', NULL),
    ('ESI Contribution',     'ESI',        '0.75% of Gross (health contribution)',        'CONTRIBUTION','PERCENTAGE',  70, NULL,    0.75,'GROSS', NULL),
    ('Professional Tax',     'PT_TAX',     'Fixed professional tax per month',            'DEDUCTION',   'FIXED',       80, 200.00,  NULL, NULL,    NULL),
    ('TDS / Income Tax',     'TDS',        'Monthly TDS on projected annual income',      'TAX',         'FORMULA',     90, NULL,    NULL, NULL,    'annual_tax / 12'),
    ('Total Deductions',     'DEDUCTIONS', 'PF + ESI + Professional Tax + TDS',          'DEDUCTION',   'FORMULA',    100, NULL,    NULL, NULL,    'PF + ESI + PT_TAX + TDS'),
    ('Net Salary',           'NET',        'Gross minus Total Deductions',                'NET',         'FORMULA',    110, NULL,    NULL, NULL,    'GROSS - DEDUCTIONS')
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- SALARY STRUCTURE RULES
-- =========================================================

CREATE TABLE IF NOT EXISTS salary_structure_rules (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_structure_id  UUID NOT NULL,
    salary_rule_id       UUID NOT NULL,
    sequence             INTEGER NOT NULL DEFAULT 10,
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ssr_structure
        FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
    CONSTRAINT fk_ssr_rule
        FOREIGN KEY (salary_rule_id)      REFERENCES salary_rules(id)      ON DELETE CASCADE,
    UNIQUE(salary_structure_id, salary_rule_id)
);

-- Attach all rules to Regular Monthly structure
DO $$
DECLARE v_sid UUID;
BEGIN
    SELECT id INTO v_sid FROM salary_structures WHERE code = 'REG_MONTHLY';
    INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id, sequence)
    SELECT v_sid, sr.id, sr.sequence FROM salary_rules sr ORDER BY sr.sequence
    ON CONFLICT (salary_structure_id, salary_rule_id) DO NOTHING;
END $$;

-- Intern structure: Basic + Net only
DO $$
DECLARE v_sid UUID; r_basic UUID; r_net UUID;
BEGIN
    SELECT id INTO v_sid  FROM salary_structures WHERE code = 'INTERN_STIP';
    SELECT id INTO r_basic FROM salary_rules WHERE code = 'BASIC';
    SELECT id INTO r_net   FROM salary_rules WHERE code = 'NET';
    INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id, sequence)
    VALUES (v_sid, r_basic, 10), (v_sid, r_net, 110)
    ON CONFLICT (salary_structure_id, salary_rule_id) DO NOTHING;
END $$;


-- =========================================================
-- CONTRACTS
-- =========================================================

CREATE TABLE IF NOT EXISTS contracts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id          UUID NOT NULL,
    contract_number      VARCHAR(100) NOT NULL UNIQUE,
    start_date           DATE NOT NULL,
    end_date             DATE,
    department_id        UUID,
    job_position_id      UUID,
    schedule_id          UUID,
    salary_structure_id  UUID,
    wage                 NUMERIC(15,2) NOT NULL,
    wage_type            wage_type NOT NULL DEFAULT 'MONTHLY',
    status               contract_status NOT NULL DEFAULT 'DRAFT',
    trial_end_date       DATE,
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_c_employee   FOREIGN KEY (employee_id)         REFERENCES employees(id)         ON DELETE CASCADE,
    CONSTRAINT fk_c_dept       FOREIGN KEY (department_id)       REFERENCES departments(id)       ON DELETE SET NULL,
    CONSTRAINT fk_c_position   FOREIGN KEY (job_position_id)     REFERENCES job_positions(id)     ON DELETE SET NULL,
    CONSTRAINT fk_c_schedule   FOREIGN KEY (schedule_id)         REFERENCES working_schedules(id) ON DELETE SET NULL,
    CONSTRAINT fk_c_structure  FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE SET NULL,
    CONSTRAINT chk_c_dates     CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_c_wage      CHECK (wage >= 0)
);

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS no_contract_overlap;
ALTER TABLE contracts
    ADD CONSTRAINT no_contract_overlap
    EXCLUDE USING gist (
        employee_id WITH =,
        daterange(start_date, COALESCE(end_date + 1, 'infinity'::date), '[)') WITH &&
    )
    WHERE (status IN ('ACTIVE', 'DRAFT'));


-- =========================================================
-- ATTENDANCE
-- =========================================================

CREATE TABLE IF NOT EXISTS attendance (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL,
    work_date           DATE NOT NULL,
    check_in            TIMESTAMPTZ,
    check_out           TIMESTAMPTZ,
    break_minutes       INTEGER NOT NULL DEFAULT 0,
    worked_minutes      INTEGER NOT NULL DEFAULT 0,
    scheduled_minutes   INTEGER NOT NULL DEFAULT 0,
    overtime_minutes    INTEGER NOT NULL DEFAULT 0,
    late_minutes        INTEGER NOT NULL DEFAULT 0,
    early_exit_minutes  INTEGER NOT NULL DEFAULT 0,
    status              attendance_status NOT NULL DEFAULT 'PRESENT',
    is_manual_entry     BOOLEAN NOT NULL DEFAULT FALSE,
    correction_reason   TEXT,
    corrected_by        UUID,
    corrected_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_att_employee    FOREIGN KEY (employee_id)  REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_corrector   FOREIGN KEY (corrected_by) REFERENCES users(id)     ON DELETE SET NULL,
    CONSTRAINT chk_att_cout       CHECK (check_out IS NULL OR check_out > check_in),
    CONSTRAINT chk_att_minutes    CHECK (break_minutes >= 0 AND worked_minutes >= 0 AND
                                         scheduled_minutes >= 0 AND overtime_minutes >= 0 AND
                                         late_minutes >= 0 AND early_exit_minutes >= 0),
    UNIQUE(employee_id, work_date)
);


-- =========================================================
-- TIME OFF TYPES
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_types (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(150) NOT NULL,
    code                 VARCHAR(50)  NOT NULL UNIQUE,
    description          TEXT,
    unit                 leave_unit NOT NULL DEFAULT 'DAYS',
    requires_allocation  BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval    BOOLEAN NOT NULL DEFAULT TRUE,
    approval_mode        approval_mode NOT NULL DEFAULT 'MANAGER_APPROVAL',
    payroll_integration  BOOLEAN NOT NULL DEFAULT TRUE,
    is_paid              BOOLEAN NOT NULL DEFAULT TRUE,
    max_days_per_request INTEGER,
    max_days_per_year    INTEGER,
    carry_forward        BOOLEAN NOT NULL DEFAULT FALSE,
    active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO time_off_types (name, code, description, unit, requires_allocation, is_paid, max_days_per_year) VALUES
    ('Annual Leave',    'AL', 'Paid annual vacation leave',                  'DAYS', TRUE,  TRUE,  21),
    ('Sick Leave',      'SL', 'Paid sick / medical leave',                   'DAYS', FALSE, TRUE,  12),
    ('Casual Leave',    'CL', 'Short-notice casual leave',                   'DAYS', FALSE, TRUE,   6),
    ('Maternity Leave', 'ML', 'Paid maternity leave (statutory)',            'DAYS', FALSE, TRUE, 182),
    ('Paternity Leave', 'PL', 'Paid paternity leave',                        'DAYS', FALSE, TRUE,  15),
    ('Unpaid Leave',    'UL', 'Unpaid leave — deducted from salary',         'DAYS', FALSE, FALSE, NULL),
    ('Comp Off',        'CO', 'Compensatory off for overtime/holiday worked','DAYS', TRUE,  TRUE,  NULL)
ON CONFLICT (code) DO NOTHING;


-- =========================================================
-- TIME OFF ALLOCATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_allocations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id       UUID NOT NULL,
    time_off_type_id  UUID NOT NULL,
    allocated_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
    used_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
    remaining_amount  NUMERIC(10,2) GENERATED ALWAYS AS (allocated_amount - used_amount) STORED,
    valid_from        DATE NOT NULL,
    valid_to          DATE NOT NULL,
    status            allocation_status NOT NULL DEFAULT 'DRAFT',
    notes             TEXT,
    approved_by       UUID,
    approved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_al_employee   FOREIGN KEY (employee_id)      REFERENCES employees(id)      ON DELETE CASCADE,
    CONSTRAINT fk_al_type       FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id) ON DELETE CASCADE,
    CONSTRAINT fk_al_approved   FOREIGN KEY (approved_by)      REFERENCES users(id)          ON DELETE SET NULL,
    CONSTRAINT chk_al_amounts   CHECK (allocated_amount >= 0 AND used_amount >= 0 AND used_amount <= allocated_amount),
    CONSTRAINT chk_al_dates     CHECK (valid_to >= valid_from)
);


-- =========================================================
-- TIME OFF REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS time_off_requests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id       UUID NOT NULL,
    time_off_type_id  UUID NOT NULL,
    allocation_id     UUID,
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    duration          NUMERIC(10,2) NOT NULL,
    unit              leave_unit NOT NULL DEFAULT 'DAYS',
    reason            TEXT,
    status            time_off_status NOT NULL DEFAULT 'PENDING',
    approved_by       UUID,
    approved_at       TIMESTAMPTZ,
    refusal_reason    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tor_employee   FOREIGN KEY (employee_id)      REFERENCES employees(id)            ON DELETE CASCADE,
    CONSTRAINT fk_tor_type       FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id)       ON DELETE CASCADE,
    CONSTRAINT fk_tor_allocation FOREIGN KEY (allocation_id)    REFERENCES time_off_allocations(id) ON DELETE SET NULL,
    CONSTRAINT fk_tor_approved   FOREIGN KEY (approved_by)      REFERENCES users(id)                ON DELETE SET NULL,
    CONSTRAINT chk_tor_dates     CHECK (end_date >= start_date),
    CONSTRAINT chk_tor_duration  CHECK (duration > 0)
);


-- =========================================================
-- TAX CONFIGURATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS tax_configurations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country        VARCHAR(100) NOT NULL,
    financial_year VARCHAR(20)  NOT NULL,
    regime         VARCHAR(100) NOT NULL,
    description    TEXT,
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(country, financial_year, regime)
);

INSERT INTO tax_configurations (country, financial_year, regime, description) VALUES
    ('India', '2024-25', 'New Regime', 'India New Tax Regime FY 2024-25'),
    ('India', '2024-25', 'Old Regime', 'India Old Tax Regime FY 2024-25')
ON CONFLICT (country, financial_year, regime) DO NOTHING;


-- =========================================================
-- TAX SLABS
-- =========================================================

CREATE TABLE IF NOT EXISTS tax_slabs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_configuration_id UUID NOT NULL,
    min_income           NUMERIC(15,2) NOT NULL,
    max_income           NUMERIC(15,2),
    tax_rate             NUMERIC(8,4) NOT NULL,
    surcharge_rate       NUMERIC(8,4) NOT NULL DEFAULT 0,
    cess_rate            NUMERIC(8,4) NOT NULL DEFAULT 4.0,
    sequence             INTEGER NOT NULL DEFAULT 10,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ts_config FOREIGN KEY (tax_configuration_id) REFERENCES tax_configurations(id) ON DELETE CASCADE,
    CONSTRAINT chk_ts_inc   CHECK (min_income >= 0 AND (max_income IS NULL OR max_income > min_income)),
    CONSTRAINT chk_ts_rate  CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

DO $$
DECLARE v_cfg UUID;
BEGIN
    SELECT id INTO v_cfg FROM tax_configurations
    WHERE country = 'India' AND financial_year = '2024-25' AND regime = 'New Regime';
    INSERT INTO tax_slabs (tax_configuration_id, min_income, max_income, tax_rate, sequence) VALUES
        (v_cfg,       0,    300000,  0.00, 10),
        (v_cfg,  300001,    600000,  5.00, 20),
        (v_cfg,  600001,    900000, 10.00, 30),
        (v_cfg,  900001,   1200000, 15.00, 40),
        (v_cfg, 1200001,   1500000, 20.00, 50),
        (v_cfg, 1500001,      NULL, 30.00, 60);
END $$;


-- =========================================================
-- PAYRUNS
-- =========================================================

CREATE TABLE IF NOT EXISTS payruns (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(150) NOT NULL,
    salary_structure_id  UUID NOT NULL,
    period_start         DATE NOT NULL,
    period_end           DATE NOT NULL,
    status               payrun_status NOT NULL DEFAULT 'DRAFT',
    employee_count       INTEGER       NOT NULL DEFAULT 0,
    total_gross          NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_deductions     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_tax            NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_net            NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes                TEXT,
    created_by           UUID NOT NULL,
    computed_at          TIMESTAMPTZ,
    validated_at         TIMESTAMPTZ,
    validated_by         UUID,
    paid_at              TIMESTAMPTZ,
    paid_by              UUID,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pr_structure    FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pr_created_by   FOREIGN KEY (created_by)          REFERENCES users(id)             ON DELETE RESTRICT,
    CONSTRAINT fk_pr_validated_by FOREIGN KEY (validated_by)        REFERENCES users(id)             ON DELETE SET NULL,
    CONSTRAINT fk_pr_paid_by      FOREIGN KEY (paid_by)             REFERENCES users(id)             ON DELETE SET NULL,
    CONSTRAINT chk_pr_dates       CHECK (period_end >= period_start),
    CONSTRAINT chk_pr_totals      CHECK (employee_count >= 0 AND total_gross >= 0 AND
                                         total_deductions >= 0 AND total_tax >= 0 AND total_net >= 0)
);


-- =========================================================
-- PAYRUN EMPLOYEES  (wizard step 2 selection)
-- =========================================================

CREATE TABLE IF NOT EXISTS payrun_employees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id   UUID NOT NULL,
    employee_id UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pe_payrun   FOREIGN KEY (payrun_id)   REFERENCES payruns(id)   ON DELETE CASCADE,
    CONSTRAINT fk_pe_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(payrun_id, employee_id)
);


-- =========================================================
-- PAYSLIPS
-- =========================================================

CREATE TABLE IF NOT EXISTS payslips (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_number       VARCHAR(100)  NOT NULL UNIQUE,
    payrun_id            UUID NOT NULL,
    employee_id          UUID NOT NULL,
    contract_id          UUID NOT NULL,
    salary_structure_id  UUID NOT NULL,
    period_start         DATE NOT NULL,
    period_end           DATE NOT NULL,
    worked_days          NUMERIC(10,2) NOT NULL DEFAULT 0,
    worked_hours         NUMERIC(10,2) NOT NULL DEFAULT 0,
    scheduled_days       NUMERIC(10,2) NOT NULL DEFAULT 0,
    gross_salary         NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_allowances     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_deductions     NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_amount           NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_salary           NUMERIC(18,2) NOT NULL DEFAULT 0,
    status               payslip_status NOT NULL DEFAULT 'DRAFT',
    pdf_url              TEXT,
    pdf_generated_at     TIMESTAMPTZ,
    email_sent_at        TIMESTAMPTZ,
    email_sent_to        VARCHAR(255),
    computation_log      JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ps_payrun    FOREIGN KEY (payrun_id)           REFERENCES payruns(id)          ON DELETE CASCADE,
    CONSTRAINT fk_ps_employee  FOREIGN KEY (employee_id)         REFERENCES employees(id)        ON DELETE CASCADE,
    CONSTRAINT fk_ps_contract  FOREIGN KEY (contract_id)         REFERENCES contracts(id)        ON DELETE RESTRICT,
    CONSTRAINT fk_ps_structure FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ps_dates    CHECK (period_end >= period_start),
    CONSTRAINT chk_ps_amounts  CHECK (worked_days >= 0 AND worked_hours >= 0 AND gross_salary >= 0 AND
                                       total_deductions >= 0 AND tax_amount >= 0 AND net_salary >= 0),
    UNIQUE(employee_id, payrun_id)
);


-- =========================================================
-- PAYSLIP LINES
-- =========================================================

CREATE TABLE IF NOT EXISTS payslip_lines (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id     UUID NOT NULL,
    salary_rule_id UUID,
    rule_code      VARCHAR(50)     NOT NULL,
    rule_name      VARCHAR(150)    NOT NULL,
    category       salary_category NOT NULL,
    sequence       INTEGER NOT NULL DEFAULT 10,
    base_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    percentage     NUMERIC(8,4),
    amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
    formula_used   TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pl_payslip FOREIGN KEY (payslip_id)     REFERENCES payslips(id)     ON DELETE CASCADE,
    CONSTRAINT fk_pl_rule    FOREIGN KEY (salary_rule_id) REFERENCES salary_rules(id) ON DELETE SET NULL,
    CONSTRAINT chk_pl_base   CHECK (base_amount >= 0)
);


-- =========================================================
-- PAYROLL WARNINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS payroll_warnings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id    UUID,
    payslip_id   UUID,
    employee_id  UUID,
    warning_type VARCHAR(100) NOT NULL,
    severity     warning_severity NOT NULL DEFAULT 'WARNING',
    message      TEXT NOT NULL,
    resolved     BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by  UUID,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pw_payrun      FOREIGN KEY (payrun_id)   REFERENCES payruns(id)   ON DELETE CASCADE,
    CONSTRAINT fk_pw_payslip     FOREIGN KEY (payslip_id)  REFERENCES payslips(id)  ON DELETE CASCADE,
    CONSTRAINT fk_pw_employee    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT fk_pw_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)     ON DELETE SET NULL
);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    action      VARCHAR(100) NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        notification_type NOT NULL DEFAULT 'INFO',
    entity_type VARCHAR(100),
    entity_id   UUID,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- =========================================================
-- EMAIL DELIVERY LOG
-- =========================================================

CREATE TABLE IF NOT EXISTS email_delivery_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id       UUID,
    payslip_id      UUID,
    employee_id     UUID,
    recipient_email VARCHAR(255) NOT NULL,
    subject         VARCHAR(500),
    status          VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_edl_payrun   FOREIGN KEY (payrun_id)   REFERENCES payruns(id)   ON DELETE SET NULL,
    CONSTRAINT fk_edl_payslip  FOREIGN KEY (payslip_id)  REFERENCES payslips(id)  ON DELETE SET NULL,
    CONSTRAINT fk_edl_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_emp_department       ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_emp_manager          ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_emp_status           ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_type             ON employees(employee_type_id);
CREATE INDEX IF NOT EXISTS idx_emp_user             ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee   ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_dates      ON contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status     ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_att_employee_date    ON attendance(employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_att_status           ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_att_work_date        ON attendance(work_date);
CREATE INDEX IF NOT EXISTS idx_tor_employee_dates   ON time_off_requests(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tor_status           ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_alloc_employee       ON time_off_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_alloc_status         ON time_off_allocations(status);
CREATE INDEX IF NOT EXISTS idx_ssr_structure        ON salary_structure_rules(salary_structure_id);
CREATE INDEX IF NOT EXISTS idx_payrun_period        ON payruns(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payrun_status        ON payruns(status);
CREATE INDEX IF NOT EXISTS idx_pe_payrun            ON payrun_employees(payrun_id);
CREATE INDEX IF NOT EXISTS idx_pe_employee          ON payrun_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_ps_employee          ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_ps_payrun            ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_ps_status            ON payslips(status);
CREATE INDEX IF NOT EXISTS idx_pl_payslip           ON payslip_lines(payslip_id);
CREATE INDEX IF NOT EXISTS idx_pl_category          ON payslip_lines(category);
CREATE INDEX IF NOT EXISTS idx_pw_payrun            ON payroll_warnings(payrun_id);
CREATE INDEX IF NOT EXISTS idx_pw_employee          ON payroll_warnings(employee_id);
CREATE INDEX IF NOT EXISTS idx_al_entity            ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread    ON notifications(user_id, is_read);


-- =========================================================
-- FUNCTION: auto-update updated_at
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;


-- =========================================================
-- FUNCTION: recompute schedule weekly_hours when days change
-- =========================================================

CREATE OR REPLACE FUNCTION refresh_schedule_weekly_hours()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_total NUMERIC(6,2); v_sid UUID;
BEGIN
    v_sid := COALESCE(NEW.schedule_id, OLD.schedule_id);
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0 - break_minutes / 60.0
    ), 0) INTO v_total
    FROM schedule_days WHERE schedule_id = v_sid AND is_working_day = TRUE;
    UPDATE working_schedules SET weekly_hours = v_total, updated_at = NOW() WHERE id = v_sid;
    RETURN COALESCE(NEW, OLD);
END; $$;


-- =========================================================
-- FUNCTION: deduct leave allocation when request approved
-- =========================================================

CREATE OR REPLACE FUNCTION deduct_allocation_on_approval()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' AND NEW.allocation_id IS NOT NULL THEN
        UPDATE time_off_allocations
        SET used_amount = used_amount + NEW.duration, updated_at = NOW()
        WHERE id = NEW.allocation_id AND (allocated_amount - used_amount) >= NEW.duration;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Insufficient leave balance in allocation % for employee %',
                NEW.allocation_id, NEW.employee_id;
        END IF;
    END IF;
    IF OLD.status = 'APPROVED' AND NEW.status IN ('REFUSED','CANCELLED') AND NEW.allocation_id IS NOT NULL THEN
        UPDATE time_off_allocations
        SET used_amount = GREATEST(used_amount - OLD.duration, 0), updated_at = NOW()
        WHERE id = NEW.allocation_id;
    END IF;
    RETURN NEW;
END; $$;


-- =========================================================
-- FUNCTION: generate payslip number
-- =========================================================

CREATE OR REPLACE FUNCTION generate_payslip_number(p_period_start DATE, p_employee_code VARCHAR)
RETURNS VARCHAR LANGUAGE plpgsql AS $$
DECLARE v_seq INTEGER; v_month TEXT; v_year TEXT;
BEGIN
    v_month := LPAD(EXTRACT(MONTH FROM p_period_start)::TEXT, 2, '0');
    v_year  := EXTRACT(YEAR  FROM p_period_start)::TEXT;
    SELECT COUNT(*) + 1 INTO v_seq FROM payslips WHERE period_start = p_period_start;
    RETURN 'PS-' || v_year || v_month || '-' || p_employee_code || '-' || LPAD(v_seq::TEXT, 4, '0');
END; $$;


-- =========================================================
-- FUNCTION: validate payrun - surface warnings
-- =========================================================

CREATE OR REPLACE FUNCTION validate_payrun_warnings(p_payrun_id UUID)
RETURNS TABLE(warning_count INTEGER, error_count INTEGER) LANGUAGE plpgsql AS $$
DECLARE 
    v_warn INTEGER := 0; 
    v_err INTEGER := 0;
    v_row_count INTEGER;
BEGIN
    -- Missing bank details
    INSERT INTO payroll_warnings (payrun_id, employee_id, warning_type, severity, message)
    SELECT p_payrun_id, pe.employee_id, 'MISSING_BANK_DETAILS', 'WARNING',
           'Employee ' || e.employee_code || ' has no bank account details.'
    FROM payrun_employees pe JOIN employees e ON e.id = pe.employee_id
    WHERE pe.payrun_id = p_payrun_id
      AND (e.bank_account_number IS NULL OR e.bank_account_number = '');
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_warn := v_warn + v_row_count;

    -- Duplicate paid payslips for period
    INSERT INTO payroll_warnings (payrun_id, employee_id, warning_type, severity, message)
    SELECT p_payrun_id, pe.employee_id, 'DUPLICATE_PAYSLIP', 'ERROR',
           'Employee ' || e.employee_code || ' already has a PAID payslip for this period.'
    FROM payrun_employees pe JOIN employees e ON e.id = pe.employee_id
    JOIN payruns pr ON pr.id = p_payrun_id
    WHERE pe.payrun_id = p_payrun_id
      AND EXISTS (
          SELECT 1 FROM payslips ps2 JOIN payruns pr2 ON pr2.id = ps2.payrun_id
          WHERE ps2.employee_id = pe.employee_id AND ps2.status = 'PAID'
            AND ps2.period_start = pr.period_start AND ps2.period_end = pr.period_end
            AND ps2.payrun_id <> p_payrun_id
      );
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_err := v_err + v_row_count;

    -- No active contract for period
    INSERT INTO payroll_warnings (payrun_id, employee_id, warning_type, severity, message)
    SELECT p_payrun_id, pe.employee_id, 'MISSING_CONTRACT', 'ERROR',
           'Employee ' || e.employee_code || ' has no active contract for this period.'
    FROM payrun_employees pe JOIN employees e ON e.id = pe.employee_id
    JOIN payruns pr ON pr.id = p_payrun_id
    WHERE pe.payrun_id = p_payrun_id
      AND NOT EXISTS (
          SELECT 1 FROM contracts c
          WHERE c.employee_id = pe.employee_id AND c.status = 'ACTIVE'
            AND c.start_date <= pr.period_end
            AND (c.end_date IS NULL OR c.end_date >= pr.period_start)
      );
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_err := v_err + v_row_count;

    RETURN QUERY SELECT v_warn, v_err;
END; $$;


-- =========================================================
-- FUNCTION: get active contract for employee at a given date
-- =========================================================

CREATE OR REPLACE FUNCTION get_active_contract(p_employee_id UUID, p_date DATE)
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT id FROM contracts
    WHERE  employee_id = p_employee_id
      AND  status = 'ACTIVE'
      AND  start_date <= p_date
      AND (end_date IS NULL OR end_date >= p_date)
    ORDER BY start_date DESC
    LIMIT 1;
$$;


-- =========================================================
-- TRIGGERS: updated_at
-- =========================================================

DROP TRIGGER IF EXISTS trg_users_updated_at                ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_roles_updated_at                ON roles;
CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_departments_updated_at          ON departments;
CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_job_positions_updated_at        ON job_positions;
CREATE TRIGGER trg_job_positions_updated_at
BEFORE UPDATE ON job_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employee_types_updated_at       ON employee_types;
CREATE TRIGGER trg_employee_types_updated_at
BEFORE UPDATE ON employee_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_working_schedules_updated_at    ON working_schedules;
CREATE TRIGGER trg_working_schedules_updated_at
BEFORE UPDATE ON working_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_employees_updated_at            ON employees;
CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contracts_updated_at            ON contracts;
CREATE TRIGGER trg_contracts_updated_at
BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_salary_structures_updated_at    ON salary_structures;
CREATE TRIGGER trg_salary_structures_updated_at
BEFORE UPDATE ON salary_structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_salary_rules_updated_at         ON salary_rules;
CREATE TRIGGER trg_salary_rules_updated_at
BEFORE UPDATE ON salary_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_attendance_updated_at           ON attendance;
CREATE TRIGGER trg_attendance_updated_at
BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_time_off_types_updated_at       ON time_off_types;
CREATE TRIGGER trg_time_off_types_updated_at
BEFORE UPDATE ON time_off_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_time_off_allocations_updated_at ON time_off_allocations;
CREATE TRIGGER trg_time_off_allocations_updated_at
BEFORE UPDATE ON time_off_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_time_off_requests_updated_at    ON time_off_requests;
CREATE TRIGGER trg_time_off_requests_updated_at
BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tax_configurations_updated_at   ON tax_configurations;
CREATE TRIGGER trg_tax_configurations_updated_at
BEFORE UPDATE ON tax_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payruns_updated_at              ON payruns;
CREATE TRIGGER trg_payruns_updated_at
BEFORE UPDATE ON payruns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payslips_updated_at             ON payslips;
CREATE TRIGGER trg_payslips_updated_at
BEFORE UPDATE ON payslips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- TRIGGER: Auto-recompute weekly_hours from schedule_days
-- =========================================================

DROP TRIGGER IF EXISTS trg_sd_refresh_hours ON schedule_days;
CREATE TRIGGER trg_sd_refresh_hours
AFTER INSERT OR UPDATE OR DELETE ON schedule_days
FOR EACH ROW EXECUTE FUNCTION refresh_schedule_weekly_hours();


-- =========================================================
-- TRIGGER: Auto-deduct allocation when leave approved
-- =========================================================

DROP TRIGGER IF EXISTS trg_tor_deduct_allocation ON time_off_requests;
CREATE TRIGGER trg_tor_deduct_allocation
AFTER UPDATE ON time_off_requests
FOR EACH ROW EXECUTE FUNCTION deduct_allocation_on_approval();


-- =========================================================
-- VIEWS
-- =========================================================

-- V1: Active Employee Summary
CREATE OR REPLACE VIEW v_employee_summary AS
SELECT
    e.id,
    e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
    e.email, e.phone, e.joining_date, e.status,
    d.name   AS department_name,
    d.code   AS department_code,
    jp.name  AS job_position,
    et.name  AS employee_type,
    ws.name  AS schedule_name,
    m.first_name || ' ' || COALESCE(m.last_name, '') AS manager_name,
    c.contract_number, c.wage, c.wage_type,
    ss.name  AS salary_structure_name,
    c.start_date AS contract_start, c.end_date AS contract_end
FROM employees e
LEFT JOIN departments       d  ON d.id  = e.department_id
LEFT JOIN job_positions     jp ON jp.id = e.job_position_id
LEFT JOIN employee_types    et ON et.id = e.employee_type_id
LEFT JOIN working_schedules ws ON ws.id = e.schedule_id
LEFT JOIN employees         m  ON m.id  = e.manager_id
LEFT JOIN LATERAL (
    SELECT * FROM contracts c2 WHERE c2.employee_id = e.id AND c2.status = 'ACTIVE'
    ORDER BY c2.start_date DESC LIMIT 1
) c ON TRUE
LEFT JOIN salary_structures ss ON ss.id = c.salary_structure_id;


-- V2: Attendance Overview
CREATE OR REPLACE VIEW v_attendance_overview AS
SELECT
    a.employee_id, e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
    d.name AS department_name,
    a.work_date, a.check_in, a.check_out,
    a.worked_minutes, a.overtime_minutes, a.late_minutes,
    a.status, a.is_manual_entry
FROM attendance a
JOIN employees e ON e.id = a.employee_id
LEFT JOIN departments d ON d.id = e.department_id;


-- V3: Leave Balances
CREATE OR REPLACE VIEW v_leave_balances AS
SELECT
    al.employee_id, e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
    d.name AS department_name,
    tot.name AS leave_type, tot.code AS leave_code, tot.unit,
    al.allocated_amount, al.used_amount, al.remaining_amount,
    al.valid_from, al.valid_to, al.status AS allocation_status
FROM time_off_allocations al
JOIN employees      e   ON e.id   = al.employee_id
JOIN time_off_types tot ON tot.id = al.time_off_type_id
LEFT JOIN departments d ON d.id   = e.department_id
WHERE al.status = 'APPROVED';


-- V4: Payslip Detail
CREATE OR REPLACE VIEW v_payslip_detail AS
SELECT
    ps.id AS payslip_id, ps.payslip_number,
    pr.name AS payrun_name, pr.period_start, pr.period_end,
    e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS employee_name,
    e.email AS employee_email,
    d.name AS department_name, jp.name AS job_position,
    ss.name AS salary_structure, c.wage AS contract_wage, c.wage_type,
    ps.worked_days, ps.worked_hours, ps.scheduled_days,
    ps.gross_salary, ps.total_allowances, ps.total_deductions,
    ps.tax_amount, ps.net_salary, ps.status,
    ps.pdf_url, ps.email_sent_at
FROM payslips ps
JOIN payruns         pr ON pr.id = ps.payrun_id
JOIN employees       e  ON e.id  = ps.employee_id
JOIN contracts       c  ON c.id  = ps.contract_id
JOIN salary_structures ss ON ss.id = ps.salary_structure_id
LEFT JOIN departments  d  ON d.id  = e.department_id
LEFT JOIN job_positions jp ON jp.id = e.job_position_id;


-- V5: Payroll Dashboard KPIs
CREATE OR REPLACE VIEW v_payroll_dashboard_kpi AS
SELECT
    pr.period_start, pr.period_end,
    d.id AS department_id, d.name AS department_name,
    et.id AS employee_type_id, et.name AS employee_type,
    COUNT(DISTINCT ps.employee_id) AS payslip_count,
    SUM(ps.gross_salary)    AS total_gross,
    SUM(ps.total_deductions) AS total_deductions,
    SUM(ps.tax_amount)      AS total_tax,
    SUM(ps.net_salary)      AS total_net,
    AVG(ps.net_salary)      AS avg_net_salary,
    SUM(ps.worked_days)     AS total_worked_days
FROM payslips ps
JOIN payruns     pr ON pr.id = ps.payrun_id
JOIN employees   e  ON e.id  = ps.employee_id
LEFT JOIN departments   d  ON d.id  = e.department_id
LEFT JOIN employee_types et ON et.id = e.employee_type_id
WHERE ps.status IN ('VALIDATED','PAID')
GROUP BY pr.period_start, pr.period_end, d.id, d.name, et.id, et.name;


-- V6: Monthly Net Salary Trend
CREATE OR REPLACE VIEW v_monthly_salary_trend AS
SELECT
    DATE_TRUNC('month', pr.period_start) AS month,
    SUM(ps.net_salary)             AS total_net_salary,
    SUM(ps.gross_salary)           AS total_gross_salary,
    COUNT(DISTINCT ps.employee_id) AS employee_count
FROM payslips ps
JOIN payruns pr ON pr.id = ps.payrun_id
WHERE ps.status IN ('VALIDATED','PAID')
GROUP BY DATE_TRUNC('month', pr.period_start)
ORDER BY month;


-- V7: Department Salary Breakdown
CREATE OR REPLACE VIEW v_department_salary_breakdown AS
SELECT
    d.id AS department_id, d.name AS department_name,
    pr.period_start, pr.period_end,
    COUNT(DISTINCT e.id) AS headcount,
    SUM(ps.net_salary)   AS total_net,
    SUM(ps.gross_salary) AS total_gross,
    AVG(ps.net_salary)   AS avg_net
FROM payslips ps
JOIN payruns   pr ON pr.id = ps.payrun_id
JOIN employees e  ON e.id  = ps.employee_id
LEFT JOIN departments d ON d.id = e.department_id
WHERE ps.status IN ('VALIDATED','PAID')
GROUP BY d.id, d.name, pr.period_start, pr.period_end;


-- V8: Attendance Monthly Summary
CREATE OR REPLACE VIEW v_attendance_monthly_summary AS
SELECT
    e.department_id, d.name AS department_name,
    DATE_TRUNC('month', a.work_date) AS month,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE a.status = 'PRESENT')         AS present_count,
    COUNT(*) FILTER (WHERE a.status = 'LATE')            AS late_count,
    COUNT(*) FILTER (WHERE a.status = 'ABSENT')          AS absent_count,
    COUNT(*) FILTER (WHERE a.status = 'OVERTIME')        AS overtime_count,
    COUNT(*) FILTER (WHERE a.status = 'MISSING_CHECKOUT') AS missing_checkout,
    COUNT(*) FILTER (WHERE a.is_manual_entry = TRUE)     AS manual_edits,
    SUM(a.overtime_minutes)                              AS total_overtime_minutes
FROM attendance a
JOIN employees  e ON e.id = a.employee_id
LEFT JOIN departments d ON d.id = e.department_id
GROUP BY e.department_id, d.name, DATE_TRUNC('month', a.work_date);


-- V9: Time Off Summary
CREATE OR REPLACE VIEW v_timeoff_summary AS
SELECT
    tor.employee_id, e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
    d.name AS department_name, tot.name AS leave_type, tot.code AS leave_code,
    COUNT(*) FILTER (WHERE tor.status = 'APPROVED') AS approved_requests,
    COUNT(*) FILTER (WHERE tor.status = 'PENDING')  AS pending_requests,
    COUNT(*) FILTER (WHERE tor.status = 'REFUSED')  AS refused_requests,
    SUM(tor.duration) FILTER (WHERE tor.status = 'APPROVED') AS total_approved_days
FROM time_off_requests tor
JOIN employees      e   ON e.id   = tor.employee_id
JOIN time_off_types tot ON tot.id = tor.time_off_type_id
LEFT JOIN departments d  ON d.id  = e.department_id
GROUP BY tor.employee_id, e.employee_code, e.first_name, e.last_name,
         d.name, tot.name, tot.code;


-- V10: Active Payroll Warnings (unresolved)
CREATE OR REPLACE VIEW v_active_payroll_warnings AS
SELECT
    pw.id, pw.payrun_id, pr.name AS payrun_name,
    pw.payslip_id, pw.employee_id,
    e.employee_code,
    e.first_name || ' ' || COALESCE(e.last_name, '') AS employee_name,
    pw.warning_type, pw.severity, pw.message, pw.created_at
FROM payroll_warnings pw
LEFT JOIN payruns  pr ON pr.id = pw.payrun_id
LEFT JOIN employees e ON e.id  = pw.employee_id
WHERE pw.resolved = FALSE
ORDER BY CASE pw.severity WHEN 'CRITICAL' THEN 1 WHEN 'ERROR' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END;


-- =========================================================
-- SEED: Default Admin User (password: Admin@123)
-- =========================================================

INSERT INTO users (email, password_hash, first_name, last_name, is_active)
VALUES (
    'sanjibbayen11@gmail.com',
    crypt('Admin@123', gen_salt('bf', 12)),
    'System', 'Administrator', TRUE
) ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE v_user UUID; v_role UUID;
BEGIN
    SELECT id INTO v_user FROM users WHERE email = 'sanjibbayen11@gmail.com';
    SELECT id INTO v_role FROM roles WHERE code  = 'ADMIN';
    IF v_user IS NOT NULL AND v_role IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (v_user, v_role) ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- =========================================================
-- COMPLETE
-- =========================================================

SELECT 'PeoplePay HR & Payroll - database schema applied successfully' AS message;