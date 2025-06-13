import express from "express";
import multer from "multer";
import { uploadLecture, createLearningObjective, createStudySession, updateUser, createEvaluation } from "../controllers/quizController.js";

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('lecture'), uploadLecture);
router.post('/learning-objective', createLearningObjective);
router.post('/study-session', createStudySession);
router.put('/update-user', updateUser);
router.post('/evaluation', createEvaluation);

export default router; 