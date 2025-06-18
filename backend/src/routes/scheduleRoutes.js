import express from "express";
import { updateExtracurricular , updateCollegeSchedule } from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/update-extracurricular", updateExtracurricular);
router.post("/update-collegeSchedule", updateCollegeSchedule);

export default router;