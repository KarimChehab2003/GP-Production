import express from "express";
import { loginUser, registerUser, checkEmailAvailability } from "../controllers/authController.js";

const router = express.Router();

router.post("/check-email", checkEmailAvailability);
router.post("/login", loginUser);
router.post("/register", registerUser);

export default router;