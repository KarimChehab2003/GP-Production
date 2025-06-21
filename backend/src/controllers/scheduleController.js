import { doc, updateDoc, getDoc, addDoc, deleteDoc } from "firebase/firestore";
import { studentsCollectionRef, coursesCollectionRef } from "../config/dbCollections.js";
import { createStudySchedule } from "../services/createStudySchedule.js";
import { adaptschedule } from "../services/adaptScheduleService.js";

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
        const { studyPlan, courseSessionsMapping } = await createStudySchedule({
            ...userData,
            courses: courseDetails,
            extracurricularActivities,
            takesCurricularActivities
        });

        // Update user document with new schedule and activities
        await updateDoc(userRef, {
            ...updatedData,
            timetable: studyPlan,
            "courses-sessions-mapping": courseSessionsMapping
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

// Update College Schedule
export const updateCollegeSchedule = async (req, res) => {
    try {
        const { userId, courses } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        if (!courses || !Array.isArray(courses)) {
            return res.status(400).json({ error: "Courses data is required" });
        }

        const userRef = doc(studentsCollectionRef, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        const existingCourseIds = userData.courses || [];
        const updatedCourseIds = [];

        // Process each course
        const coursePromises = courses.map(async (course) => {
            if (course.id) {
                // Update existing course
                const courseRef = doc(coursesCollectionRef, course.id);
                await updateDoc(courseRef, {
                    courseName: course.courseName,
                    cmca: course.scores,
                    LecturesAndSectionsTimeslots: course.timeSlots
                });
                updatedCourseIds.push(course.id);
            } else {
                // Create new course
                const newCourseRef = await addDoc(coursesCollectionRef, {
                    courseName: course.courseName,
                    cmca: course.scores,
                    LecturesAndSectionsTimeslots: course.timeSlots,
                    completedSessions: 0
                });
                updatedCourseIds.push(newCourseRef.id);
            }
        });

        await Promise.all(coursePromises);

        // Delete courses that were removed
        const coursesToDelete = existingCourseIds.filter(id => !updatedCourseIds.includes(id));
        const deletePromises = coursesToDelete.map(async (courseId) => {
            const courseRef = doc(coursesCollectionRef, courseId);
            await deleteDoc(courseRef);
        });

        await Promise.all(deletePromises);

        // Generate new schedule with updated courses
        const { studyPlan, courseSessionsMapping } = await createStudySchedule({
            ...userData,
            courses: courses.map((course, index) => ({
                ...course,
                id: updatedCourseIds[index]
            }))
        });

        // Update user document with new schedule and course IDs
        await updateDoc(userRef, {
            courses: updatedCourseIds,
            timetable: studyPlan,
            "courses-sessions-mapping": courseSessionsMapping
        });

        res.json({
            message: "College schedule updated successfully",
            timetable: studyPlan,
            courseIds: updatedCourseIds,
            courseSessionsMapping
        });
    } catch (error) {
        console.error("Error updating college schedule:", error);
        res.status(500).json({ error: "Failed to update college schedule" });
    }
};

// Expose adaptschedule for API
export const adaptScheduleController = async (req, res) => {
    try {
        const student = req.body;
        const result = await adaptschedule(student);
        res.json({ studyPlan: result });
    } catch (error) {
        console.error("Error in adaptScheduleController:", error);
        res.status(500).json({ error: error.message || "Failed to adapt schedule" });
    }
};