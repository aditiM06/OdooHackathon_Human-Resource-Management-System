import bcrypt from "bcryptjs";

import db from "../config/db.js";
import { generateEmployeeCode } from "../services/employeeCodeService.js";
import { generateTemporaryPassword } from "../utils/generateTemporaryPassword.js";

export async function createEmployee(req, res) {
  const connection = await db.getConnection();

  try {
    const {
      firstName,
      lastName,
      email,
      joiningDate,
      designation,
      departmentId,
      role = "EMPLOYEE",
      employmentType = "FULL_TIME",
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !joiningDate ||
      !designation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email, joining date and designation are required",
      });
    }

    const allowedRoles = ["HR", "EMPLOYEE"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be HR or EMPLOYEE",
      });
    }

    const allowedEmploymentTypes = [
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERN",
    ];

    if (!allowedEmploymentTypes.includes(employmentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment type",
      });
    }

    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email.trim().toLowerCase()]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const employeeCode = await generateEmployeeCode(
      connection,
      firstName,
      lastName,
      joiningDate
    );

    const temporaryPassword =
      generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );

    const [userResult] = await connection.query(
      `
        INSERT INTO users (
          login_id,
          email,
          password_hash,
          role,
          must_change_password,
          is_active
        )
        VALUES (?, ?, ?, ?, TRUE, TRUE)
      `,
      [
        employeeCode,
        email.trim().toLowerCase(),
        passwordHash,
        role,
      ]
    );

    const normalizedDepartmentId =
      departmentId === undefined ||
      departmentId === null ||
      departmentId === ""
        ? null
        : Number(departmentId);

    const [employeeResult] = await connection.query(
      `
        INSERT INTO employees (
          user_id,
          department_id,
          first_name,
          last_name,
          joining_date,
          designation,
          employment_type,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userResult.insertId,
        normalizedDepartmentId,
        firstName.trim(),
        lastName.trim(),
        joiningDate,
        designation.trim(),
        employmentType,
        req.user.id,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: {
        id: employeeResult.insertId,
        loginId: employeeCode,
        email: email.trim().toLowerCase(),
        role,
        temporaryPassword,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create employee error:", error);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "The selected department does not exist",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create employee",
    });
  } finally {
    connection.release();
  }
}