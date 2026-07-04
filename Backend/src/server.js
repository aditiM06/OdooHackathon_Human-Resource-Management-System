import "dotenv/config";

import app from "./app.js";
import { testDatabaseConnection } from "./config/db.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`HRMS server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start HRMS server.");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();