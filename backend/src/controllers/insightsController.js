import { weeklyReportCollectionRef } from "../config/dbCollections.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const getInsights = async (req, res) => {
    try {
        const { userId } = req.params; // Expect userId from URL params
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }

        const insightsDocRef = doc(weeklyReportCollectionRef, userId);
        const insightsDocSnap = await getDoc(insightsDocRef);

        if (insightsDocSnap.exists()) {
            const data = insightsDocSnap.data();
            res.status(200).json({ completedTasks: data.completedTasks || [] });
        } else {
            // If document doesn't exist, return empty array
            res.status(200).json({ completedTasks: [] });
        }
    } catch (error) {
        console.error("Error getting insights:", error);
        res.status(500).json({ error: "Failed to retrieve insights." });
    }
};

export const updateInsights = async (req, res) => {
    try {
        const { userId } = req.params; // Expect userId from URL params
        const { completedTasks } = req.body; // Expect completedTasks array in body

        if (!userId || !Array.isArray(completedTasks)) {
            return res.status(400).json({ error: "User ID and completedTasks array are required." });
        }

        const insightsDocRef = doc(weeklyReportCollectionRef, userId);

        // Using setDoc with merge: true will create the document if it doesn't exist
        // or update it without overwriting other fields if they exist.
        await setDoc(insightsDocRef, { completedTasks }, { merge: true });

        res.status(200).json({ message: "Insights updated successfully.", weeklyReportId: userId });
    } catch (error) {
        console.error("Error updating insights:", error);
        res.status(500).json({ error: "Failed to update insights." });
    }
}; 