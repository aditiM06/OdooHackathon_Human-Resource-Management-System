import express from "express";
import cors from "cors";

import db from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

import employeeAdminRoutes from "./routes/admin/employeeAdminRoutes.js";
import employeeProfileRoutes from "./routes/employee/employeeProfileRoutes.js";
import attendanceRoutes from "./routes/employee/attendanceRoutes.js";
import attendanceAdminRoutes from "./routes/admin/attendanceAdminRoutes.js";
import leaveRoutes from "./routes/employee/leaveRoutes.js";
import leaveAdminRoutes from "./routes/admin/leaveAdminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

app.use("/api/admin/employees", employeeAdminRoutes);
app.use("/api/employee", employeeProfileRoutes);
app.use("/api/employee/attendance", attendanceRoutes);
app.use("/api/admin/attendance", attendanceAdminRoutes);
app.use("/api/employee/leaves", leaveRoutes);
app.use("/api/admin/leaves", leaveAdminRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS databaseName, NOW() AS serverTime"
    );

    res.status(200).json({
      success: true,
      message: "HRMS API and database are running",
      database: rows[0].databaseName,
      serverTime: rows[0].serverTime,
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(500).json({
      success: false,
      message: "API is running, but the database connection failed",
    });
  }
});

export default app;