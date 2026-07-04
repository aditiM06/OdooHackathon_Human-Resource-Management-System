import db from "../../config/db.js";

export async function getOwnProfile(req, res) {
  try {
    const [employees] = await db.query(
      `
        SELECT
          e.id,
          u.login_id AS loginId,
          u.email,
          u.role,
          u.must_change_password AS mustChangePassword,
          u.is_active AS isActive,

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

          d.id AS departmentId,
          d.name AS departmentName

        FROM employees e

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE e.user_id = ?

        LIMIT 1
      `,
      [req.user.id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const employee = employees[0];

    return res.status(200).json({
      success: true,
      employee: {
        ...employee,
        mustChangePassword: Boolean(employee.mustChangePassword),
        isActive: Boolean(employee.isActive),
      },
    });
  } catch (error) {
    console.error("Get own profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employee profile",
    });
  }
}