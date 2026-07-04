import express from "express";

import { getOwnSalary } from "../../controllers/employee/salaryController.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePasswordChangeCompleted } from "../../middleware/requirePasswordChangeCompleted.js";

const router = express.Router();

router.use(authenticate);
router.use(requirePasswordChangeCompleted);

router.get("/", getOwnSalary);

export default router;