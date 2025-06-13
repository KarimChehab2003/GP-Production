import fs from 'fs';
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import axios from 'axios';
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // Adjust path if needed

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;

export async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text.slice(0, 3000);
}

export function generateQuizPrompt(lectureText) {
    return `
<|system|>
You are a question generation assistant. I will provide you with a context passage, and you will generate different types of questions based on it. Your questions should include:

True-False Questions - Questions that the respondent must evaluate as true or false.,
Multiple Choice Questions - Questions that offer several answer options from which to choose.,
Fill-in-the-Blank Questions - Questions with missing words that need to be filled in by the respondent.,

<|user|>

Instructions:

Carefully read the context I provide.,
Identify key points, facts, and concepts within the text.,
Ensure each question is unique — no duplicates allowed.,
Provide clear and concise answers that match the information from the context.,
Format your output for clarity:
Use bullet points for each question type.,
List each question followed by its corresponding answer directly beneath it.,
,

Output:

{
    "trueFalse": [
        {
            "question": "True-False statement 1",
            "answer": "True/False"
        }
    ],
    "multipleChoice": [
        {
            "question": "Multiple choice question 1",
            "answer": "A/B/C/D"
        }
    ],
    "fillInTheBlank": [
        {
            "question": "Fill-in-the-blank statement 1",
            "answer": "Correct word(s)"
        }
    ]
}
    
<|assistant|>
Context: ${lectureText}
        `;
}

export async function callOpenRouterAPI(prompt) {
    const response = await axios.post(
        OPENROUTER_API_URL,
        {
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: {
                "Authorization": `Bearer ${OPEN_ROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data.choices[0].message.content;
}

export function extractJSONFromAIResponse(text) {
    let jsonString = null;

    // Attempt to find JSON within ```json ... ``` markdown block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
        jsonString = match[1];
    } else {
        // Fallback: If no markdown block, try to find the first { and last }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = text.substring(firstBrace, lastBrace + 1);
        }
    }

    if (jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (err) {
            console.error("JSON parse error with extracted string:", err.message);
            console.error("String attempting to parse:", jsonString);
            return null;
        }
    }

    console.warn("No JSON string found or extracted from AI response:", text);
    return null;
}

export async function generateQuizFromFile(file) {
    try {
        const lectureText = await extractTextFromPDF(file.path);
        console.log("lectureText:", lectureText);
        const prompt = generateQuizPrompt(lectureText);
        console.log("prompt:", prompt);
        const aiResponse = await callOpenRouterAPI(prompt);
        console.log("aiResponse:", aiResponse);
        const extractedJSON = extractJSONFromAIResponse(aiResponse);
        console.log("extractedJSON:", extractedJSON);
        return extractedJSON || {
            message: "Failed to extract valid JSON from AI response.",
            raw: aiResponse
        };
    } finally {
        if (file) fs.unlinkSync(file.path);
    }
}


