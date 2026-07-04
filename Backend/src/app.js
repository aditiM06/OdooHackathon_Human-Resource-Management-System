import express from "express";
import cors from "cors";

import db from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

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