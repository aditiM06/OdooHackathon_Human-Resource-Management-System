import express from "express";

import { getOwnProfile } from "../../controllers/employee/employeeProfileController.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.get(
  "/profile",
  authenticate,
  requirePasswordChangeCompleted,
  getOwnProfile
);

export default router;