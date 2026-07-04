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

function calculateTotalDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((end - start) / millisecondsPerDay) + 1;
}

export async function applyForLeave(req, res) {
  try {
    const {
      leaveTypeId,
      startDate,
      endDate,
      reason,
    } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Leave type, start date, end date and reason are required",
      });
    }

    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const parsedStartDate = new Date(`${startDate}T00:00:00`);
    const parsedEndDate = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid start and end dates are required",
      });
    }

    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const [leaveTypes] = await db.query(
      `
        SELECT id, name, is_active
        FROM leave_types
        WHERE id = ?
        LIMIT 1
      `,
      [Number(leaveTypeId)]
    );

    if (leaveTypes.length === 0 || !leaveTypes[0].is_active) {
      return res.status(400).json({
        success: false,
        message: "Selected leave type is invalid or inactive",
      });
    }

    const [overlappingRequests] = await db.query(
      `
        SELECT id
        FROM leave_requests
        WHERE employee_id = ?
          AND status IN ('PENDING', 'APPROVED')
          AND start_date <= ?
          AND end_date >= ?
        LIMIT 1
      `,
      [employeeId, endDate, startDate]
    );

    if (overlappingRequests.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "A pending or approved leave request already exists for the selected dates",
      });
    }

    const totalDays = calculateTotalDays(startDate, endDate);

    const [result] = await db.query(
      `
        INSERT INTO leave_requests (
          employee_id,
          leave_type_id,
          start_date,
          end_date,
          total_days,
          reason,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
      `,
      [
        employeeId,
        Number(leaveTypeId),
        startDate,
        endDate,
        totalDays,
        reason.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      leaveRequest: {
        id: result.insertId,
        leaveTypeId: Number(leaveTypeId),
        leaveTypeName: leaveTypes[0].name,
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Apply for leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit leave request",
    });
  }
}

export async function getOwnLeaveRequests(req, res) {
  try {
    const employeeId = await getEmployeeIdByUserId(req.user.id);

    if (!employeeId) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const [leaveRequests] = await db.query(
      `
        SELECT
          lr.id,
          lr.start_date AS startDate,
          lr.end_date AS endDate,
          lr.total_days AS totalDays,
          lr.reason,
          lr.status,
          lr.reviewer_comment AS reviewerComment,
          lr.reviewed_at AS reviewedAt,
          lr.created_at AS createdAt,

          lt.id AS leaveTypeId,
          lt.name AS leaveTypeName,
          lt.code AS leaveTypeCode,

          reviewer.login_id AS reviewedByLoginId

        FROM leave_requests lr

        INNER JOIN leave_types lt
          ON lt.id = lr.leave_type_id

        LEFT JOIN users reviewer
          ON reviewer.id = lr.reviewed_by

        WHERE lr.employee_id = ?

        ORDER BY lr.created_at DESC
      `,
      [employeeId]
    );

    return res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests,
    });
  } catch (error) {
    console.error("Get own leave requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave requests",
    });
  }
}