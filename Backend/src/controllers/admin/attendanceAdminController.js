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
export async function createAttendanceRecord(req, res) {
  try {
    const {
      employeeId,
      attendanceDate,
      checkInAt,
      checkOutAt,
      status = "PRESENT",
      remarks,
      correctionReason,
    } = req.body;

    const normalizedEmployeeId = Number(employeeId);

    if (
      !Number.isInteger(normalizedEmployeeId) ||
      normalizedEmployeeId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid employee ID is required",
      });
    }

    if (!attendanceDate) {
      return res.status(400).json({
        success: false,
        message: "Attendance date is required",
      });
    }

    if (!correctionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Correction reason is required",
      });
    }

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

    if (
      checkInAt &&
      checkOutAt &&
      new Date(checkOutAt) < new Date(checkInAt)
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-out time cannot be before check-in time",
      });
    }

    const [employees] = await db.query(
      `
        SELECT id
        FROM employees
        WHERE id = ?
        LIMIT 1
      `,
      [normalizedEmployeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const [existingRecords] = await db.query(
      `
        SELECT id
        FROM attendance_records
        WHERE employee_id = ?
          AND attendance_date = ?
        LIMIT 1
      `,
      [normalizedEmployeeId, attendanceDate]
    );

    if (existingRecords.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "An attendance record already exists for this employee and date",
      });
    }

    const workingMinutes =
      checkInAt && checkOutAt
        ? Math.max(
            0,
            Math.floor(
              (new Date(checkOutAt) - new Date(checkInAt)) /
                (1000 * 60)
            )
          )
        : null;

    const [result] = await db.query(
      `
        INSERT INTO attendance_records (
          employee_id,
          attendance_date,
          check_in_at,
          check_out_at,
          status,
          working_minutes,
          remarks,
          corrected_by,
          correction_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedEmployeeId,
        attendanceDate,
        checkInAt || null,
        checkOutAt || null,
        normalizedStatus,
        workingMinutes,
        remarks?.trim() || null,
        req.user.id,
        correctionReason.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Attendance record created successfully",
      attendanceId: result.insertId,
    });
  } catch (error) {
    console.error("Create attendance record error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create attendance record",
    });
  }
}

export async function updateAttendanceRecord(req, res) {
  try {
    const attendanceId = Number(req.params.attendanceId);

    const {
      checkInAt,
      checkOutAt,
      status,
      remarks,
      correctionReason,
    } = req.body;

    if (
      !Number.isInteger(attendanceId) ||
      attendanceId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid attendance ID is required",
      });
    }

    if (!correctionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Correction reason is required",
      });
    }

    const [records] = await db.query(
      `
        SELECT
          id,
          check_in_at,
          check_out_at,
          status,
          remarks
        FROM attendance_records
        WHERE id = ?
        LIMIT 1
      `,
      [attendanceId]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    const currentRecord = records[0];

    const updatedCheckInAt =
      checkInAt !== undefined
        ? checkInAt || null
        : currentRecord.check_in_at;

    const updatedCheckOutAt =
      checkOutAt !== undefined
        ? checkOutAt || null
        : currentRecord.check_out_at;

    const updatedStatus =
      status !== undefined
        ? status.toUpperCase()
        : currentRecord.status;

    const allowedStatuses = [
      "PRESENT",
      "ABSENT",
      "HALF_DAY",
      "LEAVE",
    ];

    if (!allowedStatuses.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    if (
      updatedCheckInAt &&
      updatedCheckOutAt &&
      new Date(updatedCheckOutAt) <
        new Date(updatedCheckInAt)
    ) {
      return res.status(400).json({
        success: false,
        message: "Check-out time cannot be before check-in time",
      });
    }

    const workingMinutes =
      updatedCheckInAt && updatedCheckOutAt
        ? Math.max(
            0,
            Math.floor(
              (new Date(updatedCheckOutAt) -
                new Date(updatedCheckInAt)) /
                (1000 * 60)
            )
          )
        : null;

    await db.query(
      `
        UPDATE attendance_records
        SET
          check_in_at = ?,
          check_out_at = ?,
          status = ?,
          working_minutes = ?,
          remarks = ?,
          corrected_by = ?,
          correction_reason = ?
        WHERE id = ?
      `,
      [
        updatedCheckInAt,
        updatedCheckOutAt,
        updatedStatus,
        workingMinutes,
        remarks !== undefined
          ? remarks?.trim() || null
          : currentRecord.remarks,
        req.user.id,
        correctionReason.trim(),
        attendanceId,
      ]
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record updated successfully",
    });
  } catch (error) {
    console.error("Update attendance record error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update attendance record",
    });
  }
}