import { db } from "./adminFirebase.js";
import { collection } from "firebase/firestore";

export const studentsCollectionRef = collection(db, "students");
export const coursesCollectionRef = collection(db, "courses");
export const weeklyReportCollectionRef = collection(db, "weekly report");