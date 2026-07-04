import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import db from "../config/db.js";

export async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Login ID/email and password are required",
      });
    }

    const [users] = await db.query(
      `
        SELECT
          id,
          login_id,
          email,
          password_hash,
          role,
          must_change_password,
          is_active
        FROM users
        WHERE login_id = ? OR email = ?
        LIMIT 1
      `,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact HR or Admin.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials",
      });
    }

    const token = jwt.sign(
  {
    userId: user.id,
    role: user.role,
    mustChangePassword: Boolean(user.must_change_password),
  },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    await db.query(
      `
        UPDATE users
        SET last_login_at = NOW()
        WHERE id = ?
      `,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        loginId: user.login_id,
        email: user.email,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password),
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const [users] = await db.query(
      `
        SELECT id, password_hash, is_active
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db.query(
      `
        UPDATE users
        SET
          password_hash = ?,
          must_change_password = FALSE,
          password_changed_at = NOW()
        WHERE id = ?
      `,
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}