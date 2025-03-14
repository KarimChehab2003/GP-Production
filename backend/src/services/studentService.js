import { getDocs, addDoc, getDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";
import { predictCMCA } from "./cmcaService.js";
import { predictStudyHours } from "./studyHoursService.js";
import formatCollegeData from "./helperFunctions/formatCollegeData.js";
import formatCurricularData from "./helperFunctions/formatCurricularData.js";
import generateSchedule from "./generateSchedule.js";
import { createStudySchedule } from "./createStudySchedule.js";

// Register New Student
export const registerNewStudent = async (data) => {
    if (!data) throw new Error("No data received");

    // Check if email already exists
    const studentsDocs = await getDocs(studentsCollectionRef);
    const students = studentsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    if (students.find((s) => s.email === data.email)) {
        throw new Error("User email already taken");
    }

    // Add courses and get references
    const courseRefs = [];
    for (const course of data.courses) {
        const createdCourseRef = await addDoc(coursesCollectionRef, {
            courseName: course.courseName,
            cmca: course.scores,
            exam_date: course.examDate,
            LecturesAndSectionsTimeslots: course.timeSlots,
        });
        courseRefs.push(createdCourseRef.id);
    }

    // console.log(data.courses);

    // Create the study schedule
    const { studyPlan, studyHours } = await createStudySchedule(data);
    console.log(studyPlan)
    // printSchedule(studyPlan.schedule);
    // console.log(studyPlan.Warnings);



    // Add student
    const studentRef = await addDoc(studentsCollectionRef, {
        ...data,
        courses: courseRefs,
        study_hours: studyHours,
        weekly_report: null,
        timetable: studyPlan
    });

    const studentDoc = await getDoc(studentRef);
    return { id: studentRef.id, ...studentDoc.data() };
};


function printSchedule(schedule) {
    const days = Object.keys(schedule);
    const timeSlots = Object.keys(schedule[days[0]]);
    const colWidth = 15; // Increase column width for better spacing

    console.log("\nGenerated Schedule:\n");

    // Print header row with more spacing
    console.log("".padEnd(colWidth) + days.map(day => day.padEnd(colWidth)).join(""));
    console.log("-".repeat(colWidth + days.length * colWidth));

    // Print each time slot row
    timeSlots.forEach(slot => {
        console.log(slot.padEnd(colWidth) + days.map(day => (schedule[day][slot] || "-").padEnd(colWidth)).join(""));
    });
}