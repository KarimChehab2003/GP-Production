import express from "express"
import cors from "cors"
import generateSchedule from "./functions/generateSchedule.js"
import { PythonShell } from "python-shell"

import { db } from "./config/adminFirebase.js"
import { getDocs, collection, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore'


const app = express();
app.use(express.json());
app.use(cors());

const studentsCollectionRef = collection(db, "students")
const coursesCollectionRef = collection(db, "courses")
const weeklyReportCollectionRef = collection(db, "weekly report")

// Login
app.post("/login", async (req, res) => {

    const data = req.body;
    console.log("Received login Data: " + data.email + " " + data.password)

    if (!data) {
        return res.status(400).json({ error: "No data received" });
    }

    // Retrieve student from database and return him if not available then return invalid string
    try {
        const studentsDocs = await getDocs(studentsCollectionRef)
        const filteredStudentData = studentsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))

        const retrievedStudent = filteredStudentData.find((student) => student.email == data.email && student.password == data.password)
        if (retrievedStudent) {
            res.json(retrievedStudent);
        } else {
            return res.status(404).json({ error: "User Does not exist" });
        }

    } catch (err) {
        return res.status(500).json({ error: err });
    }
})

///////////////////////////////////////////////

// Registration
app.post("/registration", async (req, res) => {

    const data = req.body;
    // console.log("Received Registration1 Data: " + data.fname + " " + data.lname + " " + data.email + " " + data.password)
    console.log("Received Data: ", data.courses.scores)


    if (!data) {
        return res.status(400).json({ error: "No data received" });
    }

    // Make sure email is not already available
    try {
        const studentsDocs = await getDocs(studentsCollectionRef)
        const filteredStudentData = studentsDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }))

        const retrievedStudent = filteredStudentData.find((student) => student.email == data.email)

        if (retrievedStudent) {
            return res.status(400).json({ error: "User email Already Taken" });
        }
    } catch (err) {
        return res.status(500).json({ error: err });
    }

    // Add Student to database and return him
    try {
        const createdStudentRef = await addDoc(studentsCollectionRef, {
            fname: data.fname,
            lname: data.lname,
            email: data.email,
            password: data.password
        })
        const createdStudent = await getDoc(createdStudentRef);

        if (createdStudent.exists()) {
            res.json({ id: createdStudentRef.id, ...createdStudent.data() });
        } else {
            res.status(404).json({ error: "Document not found" });
        }
    } catch (err) {
        return res.status(500).json({ error: err });
    }
})


///////////////////////////////////////////////

// CMCA
app.post("/submit-scores", async (req, res) => {
    const data = req.body;
    console.log("Received CMCA:", data);

    if (!data) {
        return res.status(400).json({ error: "No data received" });
    }

    const jsonData = JSON.stringify(data);

    let options = {
        mode: "text",
        pythonOptions: ["-u"],
        scriptPath: "./python-scripts",
    };

    try {
        const pyshell = new PythonShell("test.py", options);

        // Send input to Python
        pyshell.send(jsonData);

        // Wait for Python output
        const output = await new Promise((resolve, reject) => {
            let result = "";

            pyshell.on("message", (message) => (result += message));
            pyshell.on("error", reject);
            pyshell.end((err) => (err ? reject(err) : resolve(result)));
        });

        // Parse and send the response
        const result = JSON.parse(output);
        console.log("Python Output:", result.predicted_time_slot);
        res.json(result);

    } catch (err) {
        console.error("Python Error:", err);
        res.status(500).json({ error: "Python execution failed", details: err.message });
    }
});

///////////////////////////////////////////////

// Sample Input
let collegeSchedule = {
    "Monday": { "8AM-10AM": "Lec: Math" },
    "Wednesday": { "2PM-4PM": "Sec: Physics" }
};

let externalActivities = {
    "Gym": ["Thursday", "12PM-2PM"],
    "Club": ["Sunday", "4PM-6PM"]
};

let courses = {
    "AI": ["2PM-4PM", 8],
    "Elec": ["8PM-10PM", 2]
};

// let schedule = generateSchedule(collegeSchedule, externalActivities, courses);
// console.log(schedule)
// Output Results
// if (Object.keys(schedule).length === 0) {
//     Warnings.forEach((warning, i) => console.log(`Warning ${i + 1}: ${warning}`));
// } else {
//     console.log("\nGenerated Schedule:\n");
//     console.log("".padEnd(15) + days.map(day => day.padEnd(15)).join(""));
//     console.log("-".repeat(15 + days.length * 15));
//     timeSlots.forEach(slot => {
//         console.log(slot.padEnd(15) + days.map(day => (schedule[day][slot] || "-").padEnd(15)).join(""));
//     });

//     if (Warnings.length) {
//         console.log("\nWarnings:");
//         Warnings.forEach((warning, i) => console.log(`Warning ${i + 1}: ${warning}`));
//     }
// }


const port = 5100;
app.listen(port, console.log("Listening on port " + port + "..."))