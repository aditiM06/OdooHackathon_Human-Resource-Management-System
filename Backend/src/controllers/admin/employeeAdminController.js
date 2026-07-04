import db from "../../config/db.js";


export async function getAllEmployees(req, res) {
  try {
    const [employees] = await db.query(`
      SELECT
        e.id,
        u.login_id AS loginId,
        u.email,
        u.role,
        u.is_active AS isActive,

        e.first_name AS firstName,
        e.last_name AS lastName,
        e.phone,
        e.joining_date AS joiningDate,
        e.designation,
        e.employment_type AS employmentType,
        e.employment_status AS employmentStatus,

        d.id AS departmentId,
        d.name AS departmentName

      FROM employees e

      INNER JOIN users u
        ON u.id = e.user_id

      LEFT JOIN departments d
        ON d.id = e.department_id

      ORDER BY e.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees: employees.map((employee) => ({
        ...employee,
        isActive: Boolean(employee.isActive),
      })),
    });
  } catch (error) {
    console.error("Get all employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employees",
    });
  }
}

export async function getEmployeeById(req, res) {
  try {
    const employeeId = Number(req.params.employeeId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid employee ID is required",
      });
    }

    const [employees] = await db.query(
      `
        SELECT
          e.id,
          e.first_name AS firstName,
          e.last_name AS lastName,
          e.phone,
          e.address,
          e.date_of_birth AS dateOfBirth,
          e.joining_date AS joiningDate,
          e.designation,
          e.employment_type AS employmentType,
          e.employment_status AS employmentStatus,
          e.profile_picture AS profilePicture,

          u.login_id AS loginId,
          u.email,
          u.role,
          u.is_active AS isActive,

          d.id AS departmentId,
          d.name AS departmentName

        FROM employees e

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE e.id = ?

        LIMIT 1
      `,
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee: {
        ...employees[0],
        isActive: Boolean(employees[0].isActive),
      },
    });
  } catch (error) {
    console.error("Get employee details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employee details",
    });
  }
}