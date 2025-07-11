import { getDocs, Timestamp, collection, doc, getDoc } from 'firebase/firestore';
import { learningObjectivesCollectionRef, studySessionsCollectionRef } from '../config/dbCollections.js';
import { db } from "../config/adminFirebase.js";

class Learning_Objective {
    constructor(course, lecture_number, sessionNumber, created_at) {
        this.course = course;
        this.lecture_number = lecture_number;

        this.sessionNumber = sessionNumber;

        this.created_at = created_at;
    }
}
// I will suppose that all evaluations that are passed to be persisted in db
class evaluation {
    constructor(lecture_number, sessionNumber, created_at) {
        this.course = course;
        this.lecture_number = lecture_number;

        this.sessionNumber = sessionNumber;

        this.created_at = created_at;
    }

}
// the whole learning sequence 
let learning_sequence = []

// the set of learning_objectives
let persisted_learning_objectives = []

// sort helper function
function sortByDate(sequence) {
    return sequence.sort((a, b) => {
        // Handle both Learning_Objective and evaluation objects
        const dateA = a.created_at instanceof Timestamp ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at instanceof Timestamp ? b.created_at.toDate() : new Date(b.created_at);

        // Compare dates
        return dateA.getTime() - dateB.getTime();
    });
}

// function to format date
function formatDateDDMMYYYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// Linear Navigation Pattern
function detectLNPattern(session_sequence) {
    if (!Array.isArray(session_sequence)) return 0; // Defensive: skip if session_sequence is not an array
    let LNrelations = 0;
    let LNpvalue = 0;
    // filtering learning objectives and sorting them by date
    const learning_objectives = session_sequence.filter(lo => lo instanceof Learning_Objective);
    const sorted_learning_objectives = sortByDate(learning_objectives);
    for (let i = 0; i < sorted_learning_objectives.length - 2; i++) {// to iterate only to the last relation
        const prevLO = sorted_learning_objectives[i];
        const nextLO = sorted_learning_objectives[i + 1];
        if (nextLO.lecture_number - prevLO.lecture_number == 1) {
            LNrelations++;
        }
    }

    // calculating p value (number of relations/total number of relations)

    LNpvalue = LNrelations / (session_sequence.length - 1);
    return LNpvalue;
}

// Constant Reverse Pattern
function detectCRPattern(session_sequence) {
    if (!Array.isArray(session_sequence)) return 0; // Defensive: skip if not an array
    let already_visited = 0;
    for (const LO of session_sequence) {
        if (persisted_learning_objectives.some(check_LO =>
            check_LO.lecture_number == LO.lecture_number &&
            check_LO.course == LO.course &&
            check_LO.created_at.toDate() < LO.created_at.toDate()
            // checking for the learning objective if it was persisted on an earlier date
        )) {
            already_visited++;
        }
    }
    let CR_pvalue = already_visited / (session_sequence.length - 1);
    return CR_pvalue;
}

// In the patterns that depend on quizzes I will apply the next assumption:
// the session_sequence is the list of lectures that has been studied and ends with the quiz of a certain lecture

// Simultaneous Tasks Pattern
function detectSTPattern(session_sequence) {
    if (!Array.isArray(session_sequence)) return 0; // Defensive: skip if not an array
    let ST_relations = 0;
    const lecturesInSession = session_sequence.filter(lo => lo instanceof Learning_Objective);
    // getting number of simultaneous tasks (number of lectures in the session except
    // the quiz lecture)
    for (let lecture of lecturesInSession) {
        if (!persisted_learning_objectives.some(check_LO =>
            check_LO.lecture_number == lecture.lecture_number &&
            check_LO.course == lecture.course &&
            check_LO.created_at.toDate() < lecture.created_at.toDate()
            // checking for the learning objective if it was persisted on an earlier date
        )) {
            ST_relations++;
        }
    }
    ST_relations--; //deducting the original lecture
    let ST_pvalue = ST_relations / (session_sequence.length - 1);
    return ST_pvalue;
}

// Recalling learned material Pattern
function detectRLPattern(session_sequence) {
    if (!Array.isArray(session_sequence)) return 0; // Defensive: skip if not an array
    const evaluation_lecture = session_sequence.find(lo => lo instanceof evaluation)?.lecture_number;
    if (evaluation_lecture === undefined) return 0; // Defensive: skip if no evaluation found
    const lectures = session_sequence.filter(lo => lo instanceof Learning_Objective);
    const samesession = lectures.filter(lo => lo.lecture_number == evaluation_lecture).length > 0;
    if (!samesession) {
        return 1; //not explicitly defined in the paper
    } else {
        return 0;
    }
}




// function to calculate wmc in session

export const calculateWMCinSession = (session_sequence) => {
    if (!Array.isArray(session_sequence)) return 0; // Defensive: skip if not an array
    const patterns_indcation = [];
    let number_of_activepts = 0;
    let LN_pvalue = detectLNPattern(session_sequence);
    let CR_pvalue = detectCRPattern(session_sequence);
    let ST_pvalue = detectSTPattern(session_sequence);
    //to check with kimo
    //let RL_pvalue=detectRLPattern(session_sequence);
    if (LN_pvalue > 0) {
        number_of_activepts++;
        patterns_indcation.push(LN_pvalue);
    }
    if (CR_pvalue > 0) {
        number_of_activepts++;
        patterns_indcation.push(CR_pvalue);
    }
    if (ST_pvalue > 0) {
        number_of_activepts++;
        patterns_indcation.push(ST_pvalue);
    }
    // if(RL_pvalue>0){
    //     number_of_activepts++;
    // patterns_indcation.push(RL_pvalue);
    // }
    let wmc_indication = 0;
    for (let i = 0; i < patterns_indcation.length; i++) {
        wmc_indication += patterns_indcation[i];
    }
    wmc_indication = wmc_indication / number_of_activepts;
    let session_wmc = wmc_indication * number_of_activepts;
    return session_wmc;
}


// calculate for subject 

export const calculateWMCinSubject = async (studentID, subject_id, numberOfSessionsPerWeek) => {
    //getting learning sequence
    const learningsessionsDocs = await getDocs(studySessionsCollectionRef);
    const learning_sessions = learningsessionsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter(session => session.course == subject_id);
    // getting the course specific LOs
    const learningObjectivesDocs = await getDocs(learningObjectivesCollectionRef)
    let persisted_learning_objectives = learningObjectivesDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter(LO => LO.course == subject_id);

    // old way of getting the whole learning sequence
    // for (let sessions of learning_sessions) {
    //     if (sessions.session_sequence) {
    //         learning_sequence.push(sessions.session_sequence);
    //     }
    // }

    // retrieving completed sessions in the past two weeks
    const weeklyreportsRef = doc(collection(db, 'weekly report'), studentID);
    const weeklySnap = await getDoc(weeklyreportsRef);

    if (!weeklySnap.exists()) {
        console.error("Weekly report document not found for student:", studentID);
        return 0;
    }

    const studentWeeklyReports = weeklySnap.data();

    // assuring calculations start from Sunday 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 = Sunday

    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek);

    const earlierSunday = new Date(lastSunday);
    earlierSunday.setDate(lastSunday.getDate() - 7);


    const week1tasks = studentWeeklyReports[`week of ${formatDateDDMMYYYY(earlierSunday)}`]?.completedTasks
        ?.filter(completedTask => completedTask.courseID == subject_id) || [];

    const week2tasks = studentWeeklyReports[`week of ${formatDateDDMMYYYY(lastSunday)}`]?.completedTasks
        ?.filter(completedTask => completedTask.courseID == subject_id) || [];

    // loading the target session in the learning_sequence
    const allTasks = [...week1tasks, ...week2tasks];
    const learning_sequence = [];

    for (const completedSession of allTasks) {
        const sessionDate = new Date(completedSession.day);
        let result = learning_sessions.find(ls => {
            if (!ls.created_at) return false;
            const lsDate = ls.created_at.toDate();
            // Compare date part only, ignoring time
            return lsDate.getFullYear() === sessionDate.getFullYear() &&
                lsDate.getMonth() === sessionDate.getMonth() &&
                lsDate.getDate() === sessionDate.getDate() &&
                ls.course === completedSession.courseID;
        });

        if (result) {
            learning_sequence.push(result.session_sequence);
        }
    }

    //const targetSessions = [] // selecting the sessions of the past 2 weeks
    // for (let i = 0; i < numberOfSessionsPerWeek * 2; i++) {
    //     targetSessions.push(learning_sequence[learning_sequence.length - 1 - i]);
    // }




    let wmc_in_subject = 0;
    for (let session of learning_sequence) {
        wmc_in_subject += calculateWMCinSession(session);
    }
    wmc_in_subject = wmc_in_subject / learning_sequence.length;
    return wmc_in_subject;
}




export const calculateStudentWMC = async (studentID, numberOfStudySessions) => {
    // getting the course specific LOs
    const learningObjectivesDocs = await getDocs(learningObjectivesCollectionRef)
    let persisted_learning_objectives = learningObjectivesDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    //getting learning sequence
    const learningsessionsDocs = await getDocs(studySessionsCollectionRef);
    const learning_sessions = learningsessionsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    // for (let session of learning_sessions) {
    //     learning_sequence.push(session.session_sequence);
    // }


    const weeklyreportsRef = doc(collection(db, 'weekly report'), studentID);
    const weeklySnap = await getDoc(weeklyreportsRef);

    if (!weeklySnap.exists()) {
        console.error("Weekly report document not found for student:", studentID);
        return 0;
    }

    const studentWeeklyReports = weeklySnap.data();





    // assuring calculations start from Sunday 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 = Sunday

    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek);

    const earlierSunday = new Date(lastSunday);
    earlierSunday.setDate(lastSunday.getDate() - 7);

    const week1tasks = studentWeeklyReports[`week of ${formatDateDDMMYYYY(earlierSunday)}`]?.completedTasks || [];

    const week2tasks = studentWeeklyReports[`week of ${formatDateDDMMYYYY(lastSunday)}`]?.completedTasks || [];

    // loading the target session in the learning_sequence
    const allTasks = [...week1tasks, ...week2tasks];
    const learning_sequence = [];


    for (const completedSession of allTasks) {
        const sessionDate = new Date(completedSession.day);
        let result = learning_sessions.find(ls => {
            if (!ls.created_at) return false;
            const lsDate = ls.created_at.toDate();
            // Compare date part only, ignoring time
            return lsDate.getFullYear() === sessionDate.getFullYear() &&
                lsDate.getMonth() === sessionDate.getMonth() &&
                lsDate.getDate() === sessionDate.getDate() &&
                ls.course === completedSession.courseID;
        });

        if (result) {
            learning_sequence.push(result.session_sequence);
        }
    }

    // const targetSessions = [] // selecting the sessions of the past 2 weeks
    // for (let i = 0; i < numberOfStudySessions * 2; i++) {
    //     targetSessions.push(learning_sequence[learning_sequence.length - 1 - i]);
    // }
    let wmc_student = 0;
    for (let session of learning_sequence) {
        wmc_student += calculateWMCinSession(session);
    }
    wmc_student = wmc_student / learning_sequence.length;
    return wmc_student;
}
