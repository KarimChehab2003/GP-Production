class Learning_Objective
{
    constructor(course,lecture_number,sessionNumber){
        this.course=course;
        this.lecture_number=lecture_number;
        
        this.sessionNumber=sessionNumber;
    }
}
// I will suppose that all evaluations are passed to be persisted in db
class evaluation  {
constructor(lecture_number,sessionNumber){ 
    this.course=course;
        this.lecture_number=lecture_number;
        
        this.sessionNumber=sessionNumber;
}

}

var learning_sequence =[]


// logging the whole learning sequence for the subject
// will be retrieved from the database (Study_Sessions collection)
var previously_visited_LOs=[] // logging previously visited LOs
// retrieved from Learning_Objectives collection



// Linear Navigation Pattern
function detectLNPattern(
    session_sequence
    ){
LNrelations=0;

LNpvalue=0;

for (let i=0;i<session_sequence.length-1;i++){// to iterate only to the last relation

prevLO = session_sequence[i];
nextLO = session_sequence[i+1];
if(nextLO.lecture_number-prevLO.lecture_number==1){
    LNrelations++;
}

    }
// calculating p value (number of relations/total number of relations)

LNpvalue=LNrelations/session_sequence.length-1;

return LNpvalue;
}

// Constant Reverse Pattern
function detectCRPattern(session_sequence){
    let already_visited=0;
for(let LO in session_sequence){


if(previously_visited_LOs.includes(LO)){
    already_visited++;
}


}

CR_pvalue = already_visited/session_sequence.length-1;
return CR_pvalue;
}

// In the patterns that depend on quizzes I will apply the next assumption:
// the session_sequence is the list of lectures that has been studied and ends with the quiz of a certain lecture

// Simultaneous Tasks Pattern
function detectSTPattern(session_sequence){
let ST_relations=0;
    

let lecturesInSession= session_sequence.filter(lo=> lo instanceof Learning_Objective);


// getting number of simultaneous tasks (number of lectures in the session except
// the quiz lecture)

// getting the number of other additional lectures

const evaluation_lecture=lecturesInSession.find(lo=> lo instanceof evaluation).lecture_number;

const additional_lectures=lecturesInSession.filter(lo=> lo.lecture_number!=evaluation_lecture);

// number of relations of new lectures visited

ST_relations= additional_lectures.filter(lo=> !previously_visited_LOs.includes(lo)).length;


ST_pvalue = ST_relations/session_sequence.length-1;

return ST_pvalue;
}

// Recalling learned material Pattern
function detectRLPattern(session_sequence){


const evaluation_lecture=session_sequence.find(lo=> lo instanceof evaluation).lecture_number;

const lectures= session_sequence.filter(lo=> lo instanceof Learning_Objective);


const samesession = lectures.filter(lo=>lo.lecture_number == evaluation_lecture).length>0;

if(!samesession){
    return 1; //not explicitly defined in the paper
}else {
    return 0;
}

}




// function to calculate wmc in session

export const calculateWMCinSession = (session_sequence) => {

const patterns_indcation=[];

let number_of_activepts = 0;

let LN_pvalue=detectLNPattern(session_sequence);

let CR_pvalue=detectCRPattern(session_sequence);

let ST_pvalue=detectSTPattern(session_sequence);

let RL_pvalue=detectRLPattern(session_sequence);

if(LN_pvalue>0){
    number_of_activepts++;
patterns_indcation.push(LN_pvalue);
}


if(CR_pvalue>0){
    number_of_activepts++;
patterns_indcation.push(CR_pvalue);
}

if(ST_pvalue>0){
    number_of_activepts++;
patterns_indcation.push(ST_pvalue);
}

if(RL_pvalue>0){
    number_of_activepts++;
patterns_indcation.push(RL_pvalue);
}

let wmc_indication=0;
for(let i=0;i<patterns_indcation.length;i++){

wmc_indication += patterns_indcation[i];

}

wmc_indication = wmc_indication/number_of_activepts;


let session_wmc = wmc_indication*number_of_activepts;

// add the current session sequence to the previously_visited_LOs

for(let lo of session_sequence){

    if(!previously_visited_LOs.includes(lo)){

        previously_visited_LOs.push(lo);
    }


return session_wmc;


}
}


// calculate for subject 

export const calculateWMCinSubject = async (subject_reference , numberOfSessionsPerWeek) => {

    // retriving the previously learned LOs 
    previousDocs = await getDocs(learningObjectivesCollectionRef);

    previously_visited_LOs = previousDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    .filter(lo=> lo.course == subject_reference);

//getting getting learning sequence

learningsessionsDocs = await getDocs(studySessionsCollectionRef);

learning_sessions = learningsessionsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
.filter(lo=> lo.course == subject_reference);

for (let sessions of learning_sessions){

learning_sequence.push(sessions.session_sequence);
}

targetSessions=[] // selecting the sessions of the past 2 weeks




for(let i=0;i<numberOfSessionsPerWeek *2;i++){

    targetSessions.push(learning_sequence[learning_sequence.length-1-i]);

}

wmc_in_subject=0;

for(let session of targetSessions){

    wmc_in_subject+=calculateWMCinSession(session);

}

wmc_in_subject=wmc_in_subject/targetSessions.length;

//ensuring all los in sequence are in previously_visited_LOs

for(let session of targetSessions){

for(let lo of session.session_sequence){

    if(!previously_visited_LOs.includes(lo)){

        previously_visited_LOs.push(lo);
    }


}


return wmc_in_subject;
}
}




export const calculateStudentWMC = async (student_reference , numberOfStudySessions) =>{

    // retriving the previously learned LOs 
    previousDocs = await getDocs(learningObjectivesCollectionRef);

    previously_visited_LOs = previousDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    .filter(lo=> lo.course == subject_reference);

//getting getting learning sequence

learningsessionsDocs = await getDocs(studySessionsCollectionRef);

    learning_sessions = learningsessionsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
 
        
   for(let session of learning_sessions){
learning_sequence.push(session.session_sequence);
   }

   targetSessions=[] // selecting the sessions of the past 2 weeks




for(let i=0;i<numberOfStudySessions *2;i++){

    targetSessions.push(learning_sequence[learning_sequence.length-1-i]);

}

wmc_student=0;

for(let session of targetSessions){

    wmc_student+=calculateWMCinSession(session);

}

wmc_student=wmc_student/targetSessions.length;

//ensuring all los in sequence are in previously_visited_LOs

for(let session of targetSessions){

for(let lo of session.session_sequence){

    if(!previously_visited_LOs.includes(lo)){

        previously_visited_LOs.push(lo);
    }


}



}

return wmc_student;

}
