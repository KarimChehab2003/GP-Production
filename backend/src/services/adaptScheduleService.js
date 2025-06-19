
import { collection, query, where, getDocs, documentId } from "firebase/firestore";

import {calculateWMCinSubject , calculateStudentWMC} from "./wmcService.js";
import {coursesCollectionRef} from "../config/dbCollections.js"
import { db } from "../config/adminFirebase.js";
function compareWMC(subject_id,numberOfSessionsPerWeek,numberofSessionsForSubject){

    // verdict will be one of three values 
    // 1-"decrease" 2- "increase" 3-"same"
    let verdict =""

    wmc_subject = calculateWMCinSubject(subject_id,numberofSessionsForSubject);

    wmc_student = calculateStudentWMC(numberOfSessionsPerWeek);


    if(wmc_student < wmc_subject){
        //easy subject needs sessions decrease
        verdict="decrease"
    }else if (wmc_student >wmc_subject ){
        //hard subject needs sessions increase
verdict="increase"
    }else{
        // no difference
        verdict="same"
    }

return verdict
}

export const adaptschedule = async(student)=>{



const courseSessionsMap = student["courses-sessions-mapping"]; // or student.coursesSessionsMapping

console.log(courseSessionsMap);

// To sum all session numbers:
const totalSessions = Object.values(courseSessionsMap).reduce((sum, sessions) => sum + sessions, 0);


// checking the difference of wmc for each subject

const studentCourses = student.courses;


for(course in studentCourses){
    verdict=compareWMC(course,totalSessions,student["courses-sessions-mapping"][course]);

    if(verdict=== "decrease"){
        student["courses-sessions-mapping"][course] -=1;
    } else if(verdict === "increase"){
        student["courses-sessions-mapping"][course] +=1;
    }
    // same then no action
}

console.log(student["courses-sessions-mapping"]);


// revise this part with karim

//retrieving student courses from firebase
const studentCoursesFB = []

const coursesQuery = query(
collection(db,"courses"),
where(documentId(),"in",student.courses)
);
const querySnapshot = await getDocs(coursesQuery);


querySnapshot.forEach((doc) => {
  // Map the document as needed
  const mappedDoc = {
    id: doc.id,
    ...doc.data(),
    // add or transform fields here if needed
  };
  studentCoursesFB.push(mappedDoc);
});

// formatting the output like predictCMCA 

const predictCMCAInput = {
    courses: studentCoursesFB.map(course => ({
      courseName: course.courseName,
      scores: {
        Computation: course.scores.Computation,
        Memorization: course.scores.Memorization,
        Creativity: course.scores.Creativity,
        Analysis: course.scores.Analysis
      }
    }))
  };

  const timeslotPrediction = await predictCMCA(predictCMCAInput, student.study_hours);
  console.log("Timeslot Predictions: ", timeslotPrediction);

  // updating the number of slots after wmc update
for(course in studentCoursesFB){
     timeslotPrediction[course.courseName][1] = student["courses-sessions-mapping"][course.id]
}

// time slots prediction prepared


// format the courses array like the format college data function

let collegeSchedule ={}

courses.map((course) => {
    course.LecturesAndSectionsTimeslots.forEach(entry => {
        let { day, timeslot, type } = entry;
        let formattedType = type === "Lecture" ? "Lec" : "Sec"; // Convert type to match sample
        let courseName = course.courseName; // Replace with actual course name if available

        if (!collegeSchedule[day]) {
            collegeSchedule[day] = {};
        }

        collegeSchedule[day][timeslot] = `${formattedType}: ${courseName}`;
    });
})

// lectures and sections formatted

 // formatting the extracurriculars
 const activitiesSchedule = formatCurricularData(student.extracurricularActivities);
 console.log("Activities schedule: ", activitiesSchedule);

// final step recreating the study schedule 

const studyPlan = await generateSchedule(collegeSchedule, activitiesSchedule, timeslotPrediction);


return studyPlan; //to be persisted by other modules
}