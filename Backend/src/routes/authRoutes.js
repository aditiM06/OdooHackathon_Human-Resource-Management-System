import express from "express";

import {
  login,
  changePassword,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/login", login);
router.post("/change-password", authenticate, changePassword);

export default router;