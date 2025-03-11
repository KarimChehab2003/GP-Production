import { predictCMCA } from "./cmcaService.js";
import { predictStudyHours } from "./studyHoursService.js";
import formatCollegeData from "./helperFunctions/formatCollegeData.js";
import formatCurricularData from "./helperFunctions/formatCurricularData.js";
import generateSchedule from "./generateSchedule.js";


export const createStudySchedule = async (studentData) => {
    if (!studentData) throw new Error("No student data provided");

    // Predict study hours
    const formattedFeatures = encodeStudentData(studentData);
    const studyHoursPrediction = await predictStudyHours(formattedFeatures);

    // Predict optimal time slots
    const timeslotPrediction = await predictCMCA(studentData, studyHoursPrediction);

    // Get college schedule
    const collegeSchedule = formatCollegeData(studentData.courses);

    // Get extracurricular activities schedule
    const activitiesSchedule = formatCurricularData(studentData.extracurricularActivities);

    // Generate schedule
    return generateSchedule(collegeSchedule, activitiesSchedule, timeslotPrediction);
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
        "Sleep_Hours": Number(studentData.sleepingHours),
        "Previous_Scores": studentData.previousTermGPA ? (parseFloat(studentData.previousTermGPA) * 100) / 4 : null,
        "Tutoring_Sessions": Number(studentData.tutoringSessions),
        "Parental_Education_Level": encodingMap["Parental Education Level"][studentData.parentalEducationLevel] ?? null,
        "Distance_from_Home": encodingMap["Distance from Home"][studentData.distanceFromHome] ?? null,
        "Exam_Score": studentData.cgpa ? (parseFloat(studentData.cgpa) * 100) / 4 : null
    };
};
