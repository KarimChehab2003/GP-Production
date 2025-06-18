import { getDocs } from "firebase/firestore";
import {calculateWMCinSubject , calculateStudentWMC} from "./wmcService.js";

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

}