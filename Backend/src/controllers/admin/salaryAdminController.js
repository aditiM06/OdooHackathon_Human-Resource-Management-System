import db from "../../config/db.js";

export async function createSalaryStructure(req, res) {
  const connection = await db.getConnection();

  try {
    const employeeId = Number(req.params.employeeId);

    const {
      basicSalary,
      housingAllowance = 0,
      transportAllowance = 0,
      medicalAllowance = 0,
      otherAllowance = 0,
      deductions = 0,
      effectiveFrom,
    } = req.body;

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid employee ID is required",
      });
    }

    if (basicSalary === undefined || !effectiveFrom) {
      return res.status(400).json({
        success: false,
        message: "Basic salary and effective date are required",
      });
    }

    const salaryValues = {
      basicSalary: Number(basicSalary),
      housingAllowance: Number(housingAllowance),
      transportAllowance: Number(transportAllowance),
      medicalAllowance: Number(medicalAllowance),
      otherAllowance: Number(otherAllowance),
      deductions: Number(deductions),
    };

    const hasInvalidSalaryValue = Object.values(
      salaryValues
    ).some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0
    );

    if (hasInvalidSalaryValue) {
      return res.status(400).json({
        success: false,
        message: "Salary values must be valid non-negative numbers",
      });
    }

    await connection.beginTransaction();

    const [employees] = await connection.query(
      `
        SELECT id
        FROM employees
        WHERE id = ?
        LIMIT 1
      `,
      [employeeId]
    );

    if (employees.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await connection.query(
      `
        UPDATE salary_structures
        SET effective_to = DATE_SUB(?, INTERVAL 1 DAY)
        WHERE employee_id = ?
          AND effective_to IS NULL
      `,
      [effectiveFrom, employeeId]
    );

    const [result] = await connection.query(
      `
        INSERT INTO salary_structures (
          employee_id,
          basic_salary,
          housing_allowance,
          transport_allowance,
          medical_allowance,
          other_allowance,
          deductions,
          effective_from,
          effective_to,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
      `,
      [
        employeeId,
        salaryValues.basicSalary,
        salaryValues.housingAllowance,
        salaryValues.transportAllowance,
        salaryValues.medicalAllowance,
        salaryValues.otherAllowance,
        salaryValues.deductions,
        effectiveFrom,
        req.user.id,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Salary structure created successfully",
      salaryStructureId: result.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create salary structure error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create salary structure",
    });
  } finally {
    connection.release();
  }
}

export async function getEmployeeSalaryHistory(req, res) {
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
          u.login_id AS loginId
        FROM employees e
        INNER JOIN users u
          ON u.id = e.user_id
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

    const [salaryHistory] = await db.query(
      `
        SELECT
          id,
          basic_salary AS basicSalary,
          housing_allowance AS housingAllowance,
          transport_allowance AS transportAllowance,
          medical_allowance AS medicalAllowance,
          other_allowance AS otherAllowance,
          deductions,
          effective_from AS effectiveFrom,
          effective_to AS effectiveTo,
          created_at AS createdAt
        FROM salary_structures
        WHERE employee_id = ?
        ORDER BY effective_from DESC
      `,
      [employeeId]
    );

    return res.status(200).json({
      success: true,
      employee: employees[0],
      count: salaryHistory.length,
      salaryHistory,
    });
  } catch (error) {
    console.error("Get employee salary history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve salary history",
    });
  }
}