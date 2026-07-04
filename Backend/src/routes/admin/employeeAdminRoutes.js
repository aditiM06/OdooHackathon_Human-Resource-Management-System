import express from "express";

import {
  getAllEmployees,
  getEmployeeById,
} from "../../controllers/admin/employeeAdminController.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  requirePasswordChangeCompleted,
  authorize("ADMIN", "HR"),
  getAllEmployees
);
router.get(
  "/:employeeId",
  authenticate,
  requirePasswordChangeCompleted,
  authorize("ADMIN", "HR"),
  getEmployeeById
);


export default router;