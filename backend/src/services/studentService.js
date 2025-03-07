import { getDocs, addDoc, getDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";
import { predictCMCA } from "./cmcaService.js";

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

    // Predict timeslot for course
    const timeslotPrediction = await predictCMCA(data.courses);
    console.log("CMCA Predicted Timeslot:", timeslotPrediction)

    // Add student
    const studentRef = await addDoc(studentsCollectionRef, {
        ...data,
        courses: courseRefs,
        study_hours: 0,
        weekly_report: null,
        timetable: null,
    });

    const studentDoc = await getDoc(studentRef);
    return { id: studentRef.id, ...studentDoc.data() };
};
