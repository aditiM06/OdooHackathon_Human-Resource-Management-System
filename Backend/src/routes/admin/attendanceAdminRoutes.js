import express from "express";

import {
  getAllAttendance,
  getEmployeeAttendance,
} from "../../controllers/admin/attendanceAdminController.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);
router.use(authorize("ADMIN", "HR"));

router.get("/", getAllAttendance);
router.get("/:employeeId", getEmployeeAttendance);

export default router;