import db from "../../config/db.js";

async function getEmployeeIdByUserId(userId) {
  const [employees] = await db.query(
    `
      SELECT id
      FROM employees
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId]
  );

  return employees.length > 0 ? employees[0].id : null;
}

export async function checkIn(req, res) {
  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const [existingRecords] = await db.query(
      `
        SELECT id, check_in_at
        FROM attendance_records
        WHERE employee_id = ?
          AND attendance_date = CURDATE()
        LIMIT 1
      `,
      [employeeId]
    );

    if (existingRecords.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already checked in today",
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO attendance_records (
          employee_id,
          attendance_date,
          check_in_at,
          status
        )
        VALUES (?, CURDATE(), NOW(), 'PRESENT')
      `,
      [employeeId]
    );

    return res.status(201).json({
      success: true,
      message: "Check-in successful",
      attendanceId: result.insertId,
    });
  } catch (error) {
    console.error("Check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check in",
    });
  }
}

export async function checkOut(req, res) {
  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const [records] = await db.query(
      `
        SELECT id, check_in_at, check_out_at
        FROM attendance_records
        WHERE employee_id = ?
          AND attendance_date = CURDATE()
        LIMIT 1
      `,
      [employeeId]
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "You must check in before checking out",
      });
    }

    const attendance = records[0];

    if (attendance.check_out_at) {
      return res.status(409).json({
        success: false,
        message: "You have already checked out today",
      });
    }

    await db.query(
      `
        UPDATE attendance_records
        SET
          check_out_at = NOW(),
          working_minutes = TIMESTAMPDIFF(
            MINUTE,
            check_in_at,
            NOW()
          )
        WHERE id = ?
      `,
      [attendance.id]
    );

    return res.status(200).json({
      success: true,
      message: "Check-out successful",
    });
  } catch (error) {
    console.error("Check-out error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check out",
    });
  }
}

export async function getOwnAttendance(req, res) {
  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
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
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve attendance",
    });
  }
}