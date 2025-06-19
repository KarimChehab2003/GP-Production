import { weeklyReportCollectionRef } from "../config/dbCollections.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Helper: filter only week fields (e.g., 'week of xx/xx/xxxx')
function extractWeekFields(data) {
    const weekRegex = /^week of \d{2}\/\d{2}\/\d{4}$/;
    const result = {};
    for (const key in data) {
        if (weekRegex.test(key)) {
            result[key] = data[key];
        }
    }
    return result;
}

export const getInsights = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }
        const insightsDocRef = doc(weeklyReportCollectionRef, userId);
        const insightsDocSnap = await getDoc(insightsDocRef);
        if (insightsDocSnap.exists()) {
            const data = insightsDocSnap.data();
            // Return only week fields
            const weekFields = extractWeekFields(data);
            res.status(200).json(weekFields);
        } else {
            res.status(200).json({});
        }
    } catch (error) {
        console.error("Error getting insights:", error);
        res.status(500).json({ error: "Failed to retrieve insights." });
    }
};

export const updateInsights = async (req, res) => {
    try {
        const { userId } = req.params;
        // The body should be the week object directly (e.g., { 'week of 15/06/2025': {...} })
        const weekObject = req.body;
        if (!userId || typeof weekObject !== "object" || Array.isArray(weekObject)) {
            return res.status(400).json({ error: "User ID and week object are required." });
        }
        // Merge the week object at the root
        const insightsDocRef = doc(weeklyReportCollectionRef, userId);
        await setDoc(insightsDocRef, weekObject, { merge: true });
        res.status(200).json({ message: "Insights updated successfully.", weeklyReportId: userId });
    } catch (error) {
        console.error("Error updating insights:", error);
        res.status(500).json({ error: "Failed to update insights." });
    }
}; 