import { generateQuizFromFile } from "../services/generateQuizService.js";

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