import "dotenv/config";
import bcrypt from "bcryptjs";

import db from "../config/db.js";

async function createInitialAdmin() {
  try {
    const loginId = process.env.ADMIN_LOGIN_ID;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!loginId || !email || !password) {
      throw new Error(
        "ADMIN_LOGIN_ID, ADMIN_EMAIL and ADMIN_PASSWORD are required"
      );
    }

    const [existingUsers] = await db.query(
      `
        SELECT id
        FROM users
        WHERE login_id = ? OR email = ?
        LIMIT 1
      `,
      [loginId, email]
    );

    if (existingUsers.length > 0) {
      console.log("Initial Admin already exists");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `
        INSERT INTO users (
          login_id,
          email,
          password_hash,
          role,
          must_change_password,
          is_active
        )
        VALUES (?, ?, ?, 'ADMIN', TRUE, TRUE)
      `,
      [loginId, email, passwordHash]
    );

    console.log("Initial Admin created successfully");
    console.log(`Login ID: ${loginId}`);
    console.log(`Email: ${email}`);
    console.log("Change the temporary password after first login");
  } catch (error) {
    console.error("Failed to create initial Admin:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

createInitialAdmin();