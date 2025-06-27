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
    for (const course of data.courses) {
        const createdCourseRef = await addDoc(coursesCollectionRef, {
            courseName: course.courseName,
            cmca: course.scores,
            LecturesAndSectionsTimeslots: course.timeSlots,
        });
        courseRefs.push(createdCourseRef.id);
    }

    // console.log(data.courses);

    // Create the study schedule
    const { studyPlan, studyHours, courseSessionsMapping } = await createStudySchedule(data);
    console.log(studyPlan)
    // console.log(studyPlan.Warnings);


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
    await setDoc(doc(weeklyReportCollectionRef, studentRef.id), {});

    // Update the student document to set the weekly_report field to the new weekly report ID
    await setDoc(studentRef, { weekly_report: studentRef.id }, { merge: true });

    const studentDoc = await getDoc(studentRef);
    return { id: studentRef.id, ...studentDoc.data() };
};