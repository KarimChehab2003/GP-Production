import { doc, updateDoc } from "firebase/firestore";
import { studentsCollectionRef } from "../config/dbCollections.js";

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { userId, firstName, lastName, email, password } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: "First name, last name, password, and email are required." });
        }

        const dataToUpdate = {
            fname: firstName,
            lname: lastName,
            email: email,
            password: password
        };
        
        const userRef = doc(studentsCollectionRef, userId);
        await updateDoc(userRef, dataToUpdate);

        res.json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile." });
    }
};