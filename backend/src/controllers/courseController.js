import { db } from "../config/adminFirebase.js";
import { collection, getDocs, query, where, getDoc, doc, documentId } from "firebase/firestore";

// Get all courses
export const getAllCourses = async (req, res) => {
    try {
        const { name } = req.query;
        console.log("Backend - getAllCourses: Received name query param:", name); // Debug log
        const coursesCollectionRef = collection(db, "courses");
        let querySnapshot;
        if (name) {
            const q = query(coursesCollectionRef, where("courseName", "==", name));
            querySnapshot = await getDocs(q);
        } else {
            querySnapshot = await getDocs(coursesCollectionRef);
        }
        const courses = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        console.log("Backend - getAllCourses: Number of courses found:", courses.length); // Debug log
        res.json(courses);
    } catch (error) {
        console.error("Error getting courses:", error);
        res.status(500).json({ error: "Failed to get courses" });
    }
};

// Get course by ID
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: "Course ID is required" });
        }

        const courseDocRef = doc(db, "courses", id);
        const courseDoc = await getDoc(courseDocRef);

        if (!courseDoc.exists()) {
            return res.status(404).json({ error: "Course not found" });
        }

        res.json({ id: courseDoc.id, ...courseDoc.data() });
    } catch (error) {
        console.error("Error getting course:", error);
        res.status(500).json({ error: "Failed to get course" });
    }
};

// Get course by name
export const getCourseByName = async (req, res) => {
    try {
        const { name } = req.query;
        console.log("Backend - getCourseByName: Received name query param:", name); // Debug log
        if (!name) {
            return res.status(400).json({ error: "Course name is required" });
        }

        const coursesCollectionRef = collection(db, "courses");
        const q = query(coursesCollectionRef, where("courseName", "==", name));
        const querySnapshot = await getDocs(q);

        console.log("Backend - getCourseByName: Query snapshot empty:", querySnapshot.empty); // Debug log

        if (querySnapshot.empty) {
            return res.status(404).json({ error: "Course not found" });
        }

        const courseDoc = querySnapshot.docs[0];
        console.log("Backend - getCourseByName: Found course ID:", courseDoc.id); // Debug log
        res.json({ id: courseDoc.id, ...courseDoc.data() });
    } catch (error) {
        console.error("Error getting course:", error);
        res.status(500).json({ error: "Failed to get course" });
    }
};

// Get course by name and enrolled IDs
export const getFilteredCourse = async (req, res) => {
    try {
        const { name, enrolledIds } = req.query;
        if (!name || !enrolledIds) {
            return res.status(400).json({ error: "Course name and enrolled IDs are required" });
        }

        const enrolledIdsArray = enrolledIds.split(",");
        if (enrolledIdsArray.length === 0) {
            return res.status(400).json({ error: "Enrolled IDs array cannot be empty" });
        }

        const coursesCollectionRef = collection(db, "courses");
        const q = query(
            coursesCollectionRef,
            where("courseName", "==", name),
            where("__name__", "in", enrolledIdsArray)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return res.status(404).json({ error: "Course not found matching criteria" });
        }

        const courseDoc = querySnapshot.docs[0];
        res.json({ id: courseDoc.id, ...courseDoc.data() });
    } catch (error) {
        console.error("Error getting filtered course:", error);
        res.status(500).json({ error: "Failed to get filtered course" });
    }
}; 