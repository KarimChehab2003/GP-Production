import { doc, updateDoc, getDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";
import { createStudySchedule } from "../services/createStudySchedule.js";

// Update Extracurricular Activities
export const updateExtracurricular = async (req, res) => {
    try {
        const { userId, extracurricularActivities, takesCurricularActivities } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const userRef = doc(studentsCollectionRef, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        
        // Fetch course details for each course ID
        const courseDetails = [];
        if (userData.courses && userData.courses.length > 0) {
            for (const courseId of userData.courses) {
                const courseRef = doc(coursesCollectionRef, courseId);
                const courseDoc = await getDoc(courseRef);
                if (courseDoc.exists()) {
                    const courseData = courseDoc.data();
                    courseDetails.push({
                        courseName: courseData.courseName,
                        scores: {
                            Analysis: courseData.cmca?.Analysis || 0,
                            Computation: courseData.cmca?.Computation || 0,
                            Creativity: courseData.cmca?.Creativity || 0,
                            Memorization: courseData.cmca?.Memorization || 0
                        },
                        timeSlots: courseData.LecturesAndSectionsTimeslots?.map(slot => ({
                            day: slot.day,
                            timeslot: slot.timeslot,
                            type: slot.type
                        })) || []
                    });
                }
            }
        }
        
        // Update the user's extracurricular activities
        const updatedData = {
            extracurricularActivities,
            takesCurricularActivities
        };

        // Generate new schedule with updated activities
        const { studyPlan } = await createStudySchedule({
            ...userData,
            courses: courseDetails,
            extracurricularActivities,
            takesCurricularActivities
        });

        // Update user document with new schedule and activities
        await updateDoc(userRef, {
            ...updatedData,
            timetable: studyPlan
        });

        res.json({
            message: "Extracurricular activities updated successfully",
            timetable: studyPlan
        });
    } catch (error) {
        console.error("Error updating extracurricular activities:", error);
        res.status(500).json({ error: "Failed to update extracurricular activities" });
    }
};