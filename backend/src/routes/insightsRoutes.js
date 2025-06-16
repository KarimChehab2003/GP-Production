import express from "express";
import { getInsights, updateInsights } from "../controllers/insightsController.js";

const router = express.Router();

// Route to get user insights (completed tasks)
router.get("/insights/:userId", getInsights);

// Route to update user insights (completed tasks)
router.put("/insights/:userId", updateInsights);

export default router; 