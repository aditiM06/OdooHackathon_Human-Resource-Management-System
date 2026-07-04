USE hrms;

-- =========================================================
-- DEFAULT DEPARTMENTS
-- =========================================================

INSERT INTO departments (name, description)
VALUES
    ('Human Resources', 'Manages employees, policies and recruitment'),
    ('Engineering', 'Software development and technical operations'),
    ('Finance', 'Financial planning, accounting and payroll review'),
    ('Operations', 'Handles daily business operations')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

-- =========================================================
-- DEFAULT LEAVE TYPES
-- =========================================================

INSERT INTO leave_types (
    name,
    code,
    is_paid,
    default_days_per_year
)
VALUES
    ('Paid Leave', 'PL', TRUE, 18),
    ('Sick Leave', 'SL', TRUE, 12),
    ('Unpaid Leave', 'UL', FALSE, 0)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    is_paid = VALUES(is_paid),
    default_days_per_year = VALUES(default_days_per_year);