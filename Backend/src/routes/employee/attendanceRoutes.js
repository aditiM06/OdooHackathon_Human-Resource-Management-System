import express from "express";

import {
  checkIn,
  checkOut,
  getOwnAttendance,
} from "../../controllers/employee/attendanceController.js";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/", getOwnAttendance);

export default router;