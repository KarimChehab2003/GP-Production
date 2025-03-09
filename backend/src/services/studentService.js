import { getDocs, addDoc, getDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";
import { predictCMCA } from "./cmcaService.js";
import { predictStudyHours } from "./studyHoursService.js";

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

const encodeStudentData = (studentData) => {
    const encodingMap = {
        "Access to Resources": { "High": 0, "Medium": 2, "Low": 1 },
        "Extracurricular Activities": { "No": 0, "Yes": 1 },
        "Parental Education Level": { "High School": 1, "college": 0, "Postgraduate": 2 },
        "Distance from Home": { "Near": 2, "Moderate": 1, "Far": 0 }
    };

    return {
        "Access_to_Resources": encodingMap["Access to Resources"][studentData.accessToResources] ?? null,
        "Extracurricular_Activities": encodingMap["Extracurricular Activities"][studentData.takesCurricularActivities] ?? null,
        "Sleep_Hours": studentData.sleepingHours,
        "Previous_Scores": studentData.previousTermGPA ? (parseFloat(studentData.previousTermGPA) * 100) / 4 : null,
        "Tutoring_Sessions": studentData.tutoringSessions,
        "Parental_Education_Level": encodingMap["Parental Education Level"][studentData.parentalEducationLevel] ?? null,
        "Distance_from_Home": encodingMap["Distance from Home"][studentData.distanceFromHome] ?? null,
        "Exam_Score": studentData.cgpa ? (parseFloat(studentData.cgpa) * 100) / 4 : null
    };
};

const test = async () => {
    const studentData = {
        accessToResources: "High",
        takesCurricularActivities: "Yes",
        sleepingHours: 8,
        previousTermGPA: "3.80",
        tutoringSessions: 0,
        parentalEducationLevel: "Postgraduate",
        distanceFromHome: "Near",
        cgpa: "3.50"
    };

    const formattedData = encodeStudentData(studentData);

    console.log(formattedData);
    const result = await predictStudyHours(formattedData);
    console.log(result)

};

test();
