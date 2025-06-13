import { generateQuizFromFile } from "../services/generateQuizService.js";
import { db } from "../config/adminFirebase.js";
import { doc, updateDoc, addDoc, increment } from "firebase/firestore";
import { learningObjectivesCollectionRef, studySessionsCollectionRef, evaluationCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";

export async function uploadLecture(req, res) {
    if (!req.file) {
        return res.status(400).send("No file uploaded")
    }
    try {
        const result = await generateQuizFromFile(req.file);
        res.json(result);
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).send("Failed to generate quiz");
    }
}

export async function createLearningObjective(req, res) {
    try {
        const { course, lecture_number, session_number } = req.body;

        const learningObjectiveRef = await addDoc(learningObjectivesCollectionRef, {
            course,
            lecture_number,
            session_number,
            created_at: new Date()
        });

        res.json({
            id: learningObjectiveRef.id,
            message: "Learning objective created successfully"
        });
    } catch (error) {
        console.error("Error creating learning objective:", error);
        res.status(500).send("Failed to create learning objective");
    }
}

export async function createStudySession(req, res) {
    try {
        const { course, session_sequence, learning_sequence } = req.body;

        const studySessionRef = await addDoc(studySessionsCollectionRef, {
            course,
            session_sequence,
            learning_sequence,
            created_at: new Date()
        });

        // Increment completedSessions in the courses collection
        const courseRef = doc(coursesCollectionRef, course);
        await updateDoc(courseRef, {
            completedSessions: increment(1)
        }, { merge: true }); // Use merge: true to create the field if it doesn't exist

        res.json({
            id: studySessionRef.id,
            message: "Study session created successfully"
        });
    } catch (error) {
        console.error("Error creating study session:", error);
        res.status(500).send("Failed to create study session");
    }
}

export async function createEvaluation(req, res) {
    try {
        const { course, lecture_number, session_number, quiz } = req.body;

        const evaluationRef = await addDoc(evaluationCollectionRef, {
            course,
            lecture_number,
            session_number,
            quiz,
            created_at: new Date()
        });

        res.json({
            id: evaluationRef.id,
            message: "Evaluation created successfully"
        });
    } catch (error) {
        console.error("Error creating evaluation:", error);
        res.status(500).send("Failed to create evaluation");
    }
}

export async function updateUser(req, res) {
    try {
        const { userId, timetable } = req.body;

        const userRef = doc(db, "students", userId);
        await updateDoc(userRef, {
            timetable: timetable
        });

        res.json({
            message: "User timetable updated successfully"
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send("Failed to update user");
    }
}