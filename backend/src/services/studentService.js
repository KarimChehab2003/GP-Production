import { getDocs, addDoc, getDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef, weeklyReportCollectionRef } from "../config/dbCollections.js";
import { predictCMCA } from "./cmcaService.js";
import { predictStudyHours } from "./studyHoursService.js";
import formatCollegeData from "./helperFunctions/formatCollegeData.js";
import formatCurricularData from "./helperFunctions/formatCurricularData.js";
import generateSchedule from "./generateSchedule.js";
import { createStudySchedule } from "./createStudySchedule.js";
import { setDoc, doc } from "firebase/firestore";

// Register New Student
export const registerNewStudent = async (data) => {
    if (!data) throw new Error("No data received");

    // Add courses and get references
    const courseRefs = [];
    const coursesWithIds = [];
    for (const course of data.courses) {
        const createdCourseRef = await addDoc(coursesCollectionRef, {
            courseName: course.courseName,
            cmca: course.scores,
            LecturesAndSectionsTimeslots: course.timeSlots,
        });
        courseRefs.push(createdCourseRef.id);
        coursesWithIds.push({ ...course, id: createdCourseRef.id });
    }

    // Create the study schedule with courses that have IDs
    const { studyPlan, studyHours, courseSessionsMapping } = await createStudySchedule({
        ...data,
        courses: coursesWithIds
    });

    // Add student
    const studentRef = await addDoc(studentsCollectionRef, {
        ...data,
        courses: courseRefs,
        study_hours: studyHours,
        timetable: studyPlan,
        registeredDate: new Date().toISOString(),
        weekly_report: null,
        "courses-sessions-mapping": courseSessionsMapping
    });

    // Create a weekly report document with the same ID as the student
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    const day = String(sunday.getDate()).padStart(2, '0');
    const month = String(sunday.getMonth() + 1).padStart(2, '0');
    const year = sunday.getFullYear();
    const weekKey = `week of ${day}/${month}/${year}`;
    await setDoc(doc(weeklyReportCollectionRef, studentRef.id), {
        [weekKey]: {
            completedTasks: [],
            generatedTasks: [],
            missedTasks: []
        }
    });

    // Update the student document to set the weekly_report field to the new weekly report ID
    await setDoc(studentRef, { weekly_report: studentRef.id }, { merge: true });

    const studentDoc = await getDoc(studentRef);
    return { id: studentRef.id, ...studentDoc.data() };
};