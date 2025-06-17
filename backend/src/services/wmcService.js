import { Timestamp } from 'firebase/firestore';
class Learning_Objective
{
    constructor(course,lecture_number,sessionNumber,created_at){
        this.course=course;
        this.lecture_number=lecture_number;
        
        this.sessionNumber=sessionNumber;

        this.created_at=created_at;
    }
}
// I will suppose that all evaluations that are passed to be persisted in db
class evaluation  {
constructor(lecture_number,sessionNumber,created_at){ 
    this.course=course;
        this.lecture_number=lecture_number;
        
        this.sessionNumber=sessionNumber;

        this.created_at=created_at;
    }

}
// the whole learning sequence 
var learning_sequence =[]

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


// Linear Navigation Pattern
function detectLNPattern(
    session_sequence
    ){
LNrelations=0;

LNpvalue=0;

// filtering learning objectives and sorting them by date
learning_objectives=session_sequence.filter(lo=> lo instanceof Learning_Objective);

const sorted_learning_objectives=sortByDate(learning_objectives);



for (let i=0;i<sorted_learning_objectives.length-2;i++){// to iterate only to the last relation

prevLO = sorted_learning_objectives[i];
nextLO = sorted_learning_objectives[i+1];
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
    if (learning_sequence.some(check_LO=>
        check_LO.lecture_number==LO.lecture_number &&
        check_LO.created_at.toDate() < LO.created_at.toDate() 
        // checking for the learning objective if it was persisted on an earlier date
    ) ){
    
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



for(let lecture of lecturesInSession){
    if(!learning_sequence.some(check_LO=>
        check_LO.lecture_number==lecture.lecture_number &&
        check_LO.created_at.toDate() < lecture.created_at.toDate() 
        // checking for the learning objective if it was persisted on an earlier date
    )){
        ST_relations++;
        


    }
}

ST_relations --; //deducting the original lecture



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

//to check with kimo
//let RL_pvalue=detectRLPattern(session_sequence);

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

// if(RL_pvalue>0){
//     number_of_activepts++;
// patterns_indcation.push(RL_pvalue);
// }

let wmc_indication=0;
for(let i=0;i<patterns_indcation.length;i++){

wmc_indication += patterns_indcation[i];

}

wmc_indication = wmc_indication/number_of_activepts;


let session_wmc = wmc_indication*number_of_activepts;




return session_wmc;



}


// calculate for subject 

export const calculateWMCinSubject = async (subject_id , numberOfSessionsPerWeek) => {


//getting learning sequence

learningsessionsDocs = await getDocs(studySessionsCollectionRef);

learning_sessions = learningsessionsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
.filter(lo=> lo.course == subject_id);

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




return wmc_in_subject;

}




export const calculateStudentWMC = async (student_reference , numberOfStudySessions) =>{

    // retriving the previously learned LOs 
    previousDocs = await getDocs(learningObjectivesCollectionRef);


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


return wmc_student;

}
