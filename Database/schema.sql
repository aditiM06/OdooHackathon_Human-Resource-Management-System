-- =========================================================
-- HUMAN RESOURCE MANAGEMENT SYSTEM
-- Initial Database Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS hrms
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hrms;

-- =========================================================
-- 1. DEPARTMENTS
-- =========================================================

CREATE TABLE departments (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 2. USERS
-- Authentication and authorization information
-- =========================================================

CREATE TABLE users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    login_id VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM('ADMIN', 'HR', 'EMPLOYEE')
        NOT NULL DEFAULT 'EMPLOYEE',

    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    last_login_at DATETIME NULL,
    password_changed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_login_id (login_id),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- =========================================================
-- 3. EMPLOYEES
-- Personal and job-related employee information
-- =========================================================

CREATE TABLE employees (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    user_id INT UNSIGNED NOT NULL UNIQUE,
    department_id INT UNSIGNED NULL,
    manager_id INT UNSIGNED NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(20) NULL,
    address VARCHAR(500) NULL,
    date_of_birth DATE NULL,

    joining_date DATE NOT NULL,
    designation VARCHAR(150) NOT NULL,

    employment_type ENUM(
        'FULL_TIME',
        'PART_TIME',
        'CONTRACT',
        'INTERN'
    ) NOT NULL DEFAULT 'FULL_TIME',

    employment_status ENUM(
        'ACTIVE',
        'INACTIVE',
        'RESIGNED',
        'TERMINATED'
    ) NOT NULL DEFAULT 'ACTIVE',

    profile_picture VARCHAR(500) NULL,

    created_by INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_employees_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_employees_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_employees_manager
        FOREIGN KEY (manager_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_employees_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_employees_department (department_id),
    INDEX idx_employees_manager (manager_id),
    INDEX idx_employees_status (employment_status),
    INDEX idx_employees_joining_date (joining_date)
) ENGINE=InnoDB;

-- =========================================================
-- 4. EMPLOYEE YEAR SEQUENCES
-- Safely generates yearly employee serial numbers
--
-- Example:
-- 2026 | 7
-- means the latest serial number used for 2026 is 0007
-- =========================================================

CREATE TABLE employee_year_sequences (
    joining_year YEAR PRIMARY KEY,
    last_sequence INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 5. ATTENDANCE RECORDS
-- One attendance row per employee per date
-- =========================================================

CREATE TABLE attendance_records (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    employee_id INT UNSIGNED NOT NULL,
    attendance_date DATE NOT NULL,

    check_in_at DATETIME NULL,
    check_out_at DATETIME NULL,

    status ENUM(
        'PRESENT',
        'ABSENT',
        'HALF_DAY',
        'LEAVE'
    ) NOT NULL DEFAULT 'PRESENT',

    working_minutes INT UNSIGNED NULL,
    remarks VARCHAR(500) NULL,

    corrected_by INT UNSIGNED NULL,
    correction_reason VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_attendance_corrected_by
        FOREIGN KEY (corrected_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_employee_attendance_date
        UNIQUE (employee_id, attendance_date),

    INDEX idx_attendance_date (attendance_date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB;

-- =========================================================
-- 6. LEAVE TYPES
-- =========================================================

CREATE TABLE leave_types (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,

    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    default_days_per_year DECIMAL(5, 2) NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================================
-- 7. LEAVE BALANCES
-- Employee leave allocation and usage for each year
-- =========================================================

CREATE TABLE leave_balances (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    employee_id INT UNSIGNED NOT NULL,
    leave_type_id INT UNSIGNED NOT NULL,
    balance_year YEAR NOT NULL,

    allocated_days DECIMAL(5, 2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_leave_balance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_leave_balance_type
        FOREIGN KEY (leave_type_id)
        REFERENCES leave_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_employee_leave_balance
        UNIQUE (employee_id, leave_type_id, balance_year),

    CONSTRAINT chk_leave_allocated_days
        CHECK (allocated_days >= 0),

    CONSTRAINT chk_leave_used_days
        CHECK (used_days >= 0),

    INDEX idx_leave_balance_year (balance_year)
) ENGINE=InnoDB;

-- =========================================================
-- 8. LEAVE REQUESTS
-- =========================================================

CREATE TABLE leave_requests (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    employee_id INT UNSIGNED NOT NULL,
    leave_type_id INT UNSIGNED NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5, 2) NOT NULL,

    reason VARCHAR(1000) NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',

    reviewed_by INT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    reviewer_comment VARCHAR(1000) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_leave_request_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_leave_request_type
        FOREIGN KEY (leave_type_id)
        REFERENCES leave_types(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_leave_request_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_leave_date_range
        CHECK (end_date >= start_date),

    CONSTRAINT chk_leave_total_days
        CHECK (total_days > 0),

    INDEX idx_leave_employee (employee_id),
    INDEX idx_leave_status (status),
    INDEX idx_leave_dates (start_date, end_date)
) ENGINE=InnoDB;

-- =========================================================
-- 9. SALARY STRUCTURES
-- Salary history is preserved through effective dates
-- =========================================================

CREATE TABLE salary_structures (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    employee_id INT UNSIGNED NOT NULL,

    basic_salary DECIMAL(12, 2) NOT NULL,
    housing_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    transport_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    medical_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    other_allowance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,

    effective_from DATE NOT NULL,
    effective_to DATE NULL,

    created_by INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_salary_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_salary_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_basic_salary
        CHECK (basic_salary >= 0),

    CONSTRAINT chk_salary_effective_dates
        CHECK (
            effective_to IS NULL
            OR effective_to >= effective_from
        ),

    INDEX idx_salary_employee (employee_id),
    INDEX idx_salary_effective_date (effective_from, effective_to)
) ENGINE=InnoDB;

-- =========================================================
-- 10. EMPLOYEE DOCUMENTS
-- Stores file paths, not the physical file contents
-- =========================================================

CREATE TABLE employee_documents (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    employee_id INT UNSIGNED NOT NULL,

    document_type VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NULL,

    uploaded_by INT UNSIGNED NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_document_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_documents_employee (employee_id),
    INDEX idx_documents_type (document_type)
) ENGINE=InnoDB;

-- =========================================================
-- 11. AUDIT LOGS
-- Records important sensitive actions
-- =========================================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,

    actor_user_id INT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,

    old_values JSON NULL,
    new_values JSON NULL,

    ip_address VARCHAR(45) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    INDEX idx_audit_actor (actor_user_id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB;