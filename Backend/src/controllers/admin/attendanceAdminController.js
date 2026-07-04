import db from "../../config/db.js";

export async function getAllAttendance(req, res) {
  try {
    const { date, status } = req.query;

    const conditions = [];
    const values = [];

    if (date) {
      conditions.push("a.attendance_date = ?");
      values.push(date);
    }

    if (status) {
      const allowedStatuses = [
        "PRESENT",
        "ABSENT",
        "HALF_DAY",
        "LEAVE",
      ];

      const normalizedStatus = status.toUpperCase();

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance status",
        });
      }

      conditions.push("a.status = ?");
      values.push(normalizedStatus);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [attendance] = await db.query(
      `
        SELECT
          a.id,
          a.attendance_date AS attendanceDate,
          a.check_in_at AS checkInAt,
          a.check_out_at AS checkOutAt,
          a.status,
          a.working_minutes AS workingMinutes,
          a.remarks,

          e.id AS employeeId,
          e.first_name AS firstName,
          e.last_name AS lastName,
          e.designation,

          u.login_id AS loginId,
          u.email,

          d.name AS departmentName

        FROM attendance_records a

        INNER JOIN employees e
          ON e.id = a.employee_id

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        ${whereClause}

        ORDER BY
          a.attendance_date DESC,
          a.check_in_at DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get all attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve attendance records",
    });
  }
}

export async function getEmployeeAttendance(req, res) {
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
          e.designation,
          u.login_id AS loginId,
          u.email,
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

    const [attendance] = await db.query(
      `
        SELECT
          id,
          attendance_date AS attendanceDate,
          check_in_at AS checkInAt,
          check_out_at AS checkOutAt,
          status,
          working_minutes AS workingMinutes,
          remarks
        FROM attendance_records
        WHERE employee_id = ?
        ORDER BY attendance_date DESC
      `,
      [employeeId]
    );

    return res.status(200).json({
      success: true,
      employee: employees[0],
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get employee attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve employee attendance",
    });
  }
}