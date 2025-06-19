import express from "express";
import { updateExtracurricular, updateCollegeSchedule, adaptScheduleController } from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/update-extracurricular", updateExtracurricular);
router.post("/update-collegeSchedule", updateCollegeSchedule);
router.post("/adapt-schedule", adaptScheduleController);

export default router;