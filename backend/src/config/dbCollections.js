import { db } from "./adminFirebase.js";
import { collection } from "firebase/firestore";

export const studentsCollectionRef = collection(db, "students");
export const coursesCollectionRef = collection(db, "courses");
export const weeklyReportCollectionRef = collection(db, "weekly report");
export const learningObjectivesCollectionRef = collection(db, "Learning Objectives");
export const studySessionsCollectionRef = collection(db, "Study Sessions");
export const evaluationCollectionRef = collection(db, "evaluations");
