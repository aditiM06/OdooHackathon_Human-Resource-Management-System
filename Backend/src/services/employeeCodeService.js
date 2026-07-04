function extractFirstTwoLetters(value, fieldName) {
  const lettersOnly = value
    .trim()
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

  if (lettersOnly.length < 2) {
    throw new Error(`${fieldName} must contain at least two letters`);
  }

  return lettersOnly.slice(0, 2);
}

export async function generateEmployeeCode(
  connection,
  firstName,
  lastName,
  joiningDate
) {
  const firstNameCode = extractFirstTwoLetters(
    firstName,
    "First name"
  );

  const lastNameCode = extractFirstTwoLetters(
    lastName,
    "Last name"
  );

  const joiningYear = new Date(joiningDate).getFullYear();

  if (!joiningYear || Number.isNaN(joiningYear)) {
    throw new Error("A valid joining date is required");
  }

  await connection.query(
    `
      INSERT INTO employee_year_sequences (
        joining_year,
        last_sequence
      )
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE
        last_sequence = last_sequence + 1
    `,
    [joiningYear]
  );

  const [sequenceRows] = await connection.query(
    `
      SELECT last_sequence
      FROM employee_year_sequences
      WHERE joining_year = ?
      FOR UPDATE
    `,
    [joiningYear]
  );

  const serialNumber = String(
    sequenceRows[0].last_sequence
  ).padStart(4, "0");

  return `OI${firstNameCode}${lastNameCode}${joiningYear}${serialNumber}`;
}