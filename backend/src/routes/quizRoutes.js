import express from "express";
import multer from "multer";
import { uploadLecture } from "../controllers/quizController.js";

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('lecture'), uploadLecture)

export default router; 