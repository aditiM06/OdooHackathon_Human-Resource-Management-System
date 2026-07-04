import db from "../../config/db.js";

export async function getOwnSalary(req, res) {
  try {
    const [employees] = await db.query(
      `
        SELECT id
        FROM employees
        WHERE user_id = ?
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

    const employeeId = employees[0].id;

    const [salaryStructures] = await db.query(
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
          effective_to AS effectiveTo
        FROM salary_structures
        WHERE employee_id = ?
        ORDER BY effective_from DESC
      `,
      [employeeId]
    );

    const currentSalary =
      salaryStructures.find(
        (salary) => salary.effectiveTo === null
      ) || null;

    return res.status(200).json({
      success: true,
      currentSalary,
      salaryHistory: salaryStructures,
    });
  } catch (error) {
    console.error("Get own salary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve salary details",
    });
  }
}