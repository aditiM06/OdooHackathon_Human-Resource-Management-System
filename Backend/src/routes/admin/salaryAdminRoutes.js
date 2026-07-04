import express from "express";

import {
  createSalaryStructure,
  getEmployeeSalaryHistory,
} from "../../controllers/admin/salaryAdminController.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);
router.use(authorize("ADMIN", "HR"));

router.post("/:employeeId", createSalaryStructure);
router.get("/:employeeId", getEmployeeSalaryHistory);

export default router;