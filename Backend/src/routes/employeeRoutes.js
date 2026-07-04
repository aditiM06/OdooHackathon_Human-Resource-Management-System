import express from "express";

import { createEmployee } from "../controllers/employeeController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  requirePasswordChangeCompleted,
  authorize("ADMIN", "HR"),
  createEmployee
);
export default router;