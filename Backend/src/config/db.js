import mysql from "mysql2/promise";

const requiredDatabaseVariables = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];

for (const variableName of requiredDatabaseVariables) {
  if (process.env[variableName] === undefined) {
    throw new Error(
      `Missing required database environment variable: ${variableName}`
    );
  }
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  charset: "utf8mb4",
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function testDatabaseConnection() {
  const connection = await db.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("MySQL database connected successfully");
  } finally {
    connection.release();
  }
}

export default db;