import db from "../../config/db.js";

export async function getAllLeaveRequests(req, res) {
  try {
    const { status } = req.query;

    const values = [];
    let whereClause = "";

    if (status) {
      const allowedStatuses = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ];

      const normalizedStatus = status.toUpperCase();

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave request status",
        });
      }

      whereClause = "WHERE lr.status = ?";
      values.push(normalizedStatus);
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

          e.id AS employeeId,
          e.first_name AS firstName,
          e.last_name AS lastName,
          e.designation,

          u.login_id AS loginId,
          u.email,

          lt.id AS leaveTypeId,
          lt.name AS leaveTypeName,
          lt.code AS leaveTypeCode,

          reviewer.login_id AS reviewedByLoginId

        FROM leave_requests lr

        INNER JOIN employees e
          ON e.id = lr.employee_id

        INNER JOIN users u
          ON u.id = e.user_id

        INNER JOIN leave_types lt
          ON lt.id = lr.leave_type_id

        LEFT JOIN users reviewer
          ON reviewer.id = lr.reviewed_by

        ${whereClause}

        ORDER BY lr.created_at DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,
      count: leaveRequests.length,
      leaveRequests,
    });
  } catch (error) {
    console.error("Get all leave requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave requests",
    });
  }
}

export async function updateLeaveRequestStatus(req, res) {
  const connection = await db.getConnection();

  try {
    const leaveRequestId = Number(req.params.leaveRequestId);
    const { status, comment } = req.body;

    if (!Number.isInteger(leaveRequestId) || leaveRequestId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid leave request ID is required",
      });
    }

    const normalizedStatus = status?.toUpperCase();

    if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED or REJECTED",
      });
    }

    await connection.beginTransaction();

    const [leaveRequests] = await connection.query(
      `
        SELECT
          id,
          employee_id,
          start_date,
          end_date,
          status
        FROM leave_requests
        WHERE id = ?
        FOR UPDATE
      `,
      [leaveRequestId]
    );

    if (leaveRequests.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    const leaveRequest = leaveRequests[0];

    if (leaveRequest.status !== "PENDING") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Only pending leave requests can be reviewed",
      });
    }

    await connection.query(
      `
        UPDATE leave_requests
        SET
          status = ?,
          reviewed_by = ?,
          reviewed_at = NOW(),
          reviewer_comment = ?
        WHERE id = ?
      `,
      [
        normalizedStatus,
        req.user.id,
        comment?.trim() || null,
        leaveRequestId,
      ]
    );

    if (normalizedStatus === "APPROVED") {
      await connection.query(
        `
          UPDATE attendance_records
          SET status = 'LEAVE'
          WHERE employee_id = ?
            AND attendance_date BETWEEN ? AND ?
            AND check_in_at IS NULL
        `,
        [
          leaveRequest.employee_id,
          leaveRequest.start_date,
          leaveRequest.end_date,
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Leave request ${normalizedStatus.toLowerCase()} successfully`,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update leave status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update leave request status",
    });
  } finally {
    connection.release();
  }
}