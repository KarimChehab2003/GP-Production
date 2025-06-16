import { getDocs } from "firebase/firestore";
import { studentsCollectionRef } from "../config/dbCollections.js";
import { registerNewStudent } from "../services/studentService.js";

// Check Email Availability Controller
export const checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const studentsDocs = await getDocs(studentsCollectionRef);
        const students = studentsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        const isAvailable = !students.find((s) => s.email === email);
        
        return res.json(isAvailable);
    } catch (err) {
        return res.status(500).json({ error: "Failed to check email availability" });
    }
};

// Login Controller
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const studentsDocs = await getDocs(studentsCollectionRef);
        const students = studentsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        const user = students.find((s) => s.email === email && s.password === password);

        if (user) {
            return res.json(user);
        } else {
            return res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        return res.status(500).json({ error: "Server error", details: err.message });
    }
};

// Registration Controller
export const registerUser = async (req, res) => {
    try {
        const studentData = req.body;
        const newStudent = await registerNewStudent(studentData);
        return res.json(newStudent);
    } catch (err) {
        return res.status(400).json({ error: err || "Registration failed" });
    }
};