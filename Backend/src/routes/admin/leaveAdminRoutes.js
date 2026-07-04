import express from "express";

import {
  getAllLeaveRequests,
  updateLeaveRequestStatus,
} from "../../controllers/admin/leaveAdminController.js";

import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);
router.use(authorize("ADMIN", "HR"));

router.get("/", getAllLeaveRequests);

router.patch(
  "/:leaveRequestId/status",
  updateLeaveRequestStatus
);

export default router;