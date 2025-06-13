import express from "express";
import { getAllCourses, getCourseById, getCourseByName, getFilteredCourse } from "../controllers/courseController.js";

const router = express.Router();

// Get all courses
router.get("/", getAllCourses);

// Get course by ID
router.get("/id", getCourseById);

// Get course by name
router.get("/name", getCourseByName);

// Get course by name and enrolled IDs
router.get("/filtered", getFilteredCourse);

export default router; 