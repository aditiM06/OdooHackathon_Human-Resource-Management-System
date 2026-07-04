import express from "express";

import {
  applyForLeave,
  getOwnLeaveRequests,
} from "../../controllers/employee/leaveController.js";

import { authenticate } from "../../middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.post("/", applyForLeave);
router.get("/", getOwnLeaveRequests);

export default router;