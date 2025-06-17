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
            res.status(200).json({
                generatedTasks: data.generatedTasks || [],
                completedTasks: data.completedTasks || [],
                missedTasks: data.missedTasks || []
            });
        } else {
            // If document doesn't exist, return empty arrays
            res.status(200).json({
                generatedTasks: [],
                completedTasks: [],
                missedTasks: []
            });
        }
    } catch (error) {
        console.error("Error getting insights:", error);
        res.status(500).json({ error: "Failed to retrieve insights." });
    }
};

export const updateInsights = async (req, res) => {
    try {
        const { userId } = req.params; // Expect userId from URL params
        const { generatedTasks, completedTasks, missedTasks } = req.body; // Expect all arrays in body

        if (!userId || !Array.isArray(generatedTasks) || !Array.isArray(completedTasks) || !Array.isArray(missedTasks)) {
            return res.status(400).json({ error: "User ID, generatedTasks, completedTasks, and missedTasks arrays are required." });
        }

        const insightsDocRef = doc(weeklyReportCollectionRef, userId);

        // Using setDoc with merge: true will create the document if it doesn't exist
        // or update it without overwriting other fields if they exist.
        await setDoc(
            insightsDocRef,
            { generatedTasks, completedTasks, missedTasks },
            { merge: true }
        );

        res.status(200).json({ message: "Insights updated successfully.", weeklyReportId: userId });
    } catch (error) {
        console.error("Error updating insights:", error);
        res.status(500).json({ error: "Failed to update insights." });
    }
}; 