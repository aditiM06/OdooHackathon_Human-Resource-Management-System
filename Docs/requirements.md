## User Account Creation and First Login

Employees cannot register themselves.

An Admin or HR Officer creates a new employee account by providing the employee's personal and job-related information.

When the employee is created, the system automatically:

1. Generates a unique employee code using the employee's name, joining year and yearly sequence number.
2. Generates a temporary password.
3. Stores only the hashed version of the password.
4. Marks the account as requiring a password change.

The employee logs in using the generated employee code or registered email and the temporary password.

On the first successful login, the employee must create a new password before accessing the rest of the system.

Public registration is not available for employees, HR Officers or Administrators.

The initial Administrator account is created through the database seed process. Additional HR Officer accounts may later be created by an Administrator.
