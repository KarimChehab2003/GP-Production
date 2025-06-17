import express from "express";
import { updateExtracurricular } from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/update-extracurricular", updateExtracurricular);

export default router;