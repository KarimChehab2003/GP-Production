import express from "express"
import cors from "cors"

import { PythonShell } from "python-shell"

import { auth, db } from "./config/adminFirebase.js"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'


import { getDocs, collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'

const app = express();
app.use(express.json());
app.use(cors());


// Login
app.post("/login", async (req, res) => {

    const data = req.body;
    console.log("Received login Data: " + data.email + " " + data.password)

    if (!data) {
        return res.status(400).json({ error: "No data received" });
    }

    // Retrieve student from database and return him
    res.json({ message: "Data received" })

})

///////////////////////////////////////////////

// Registration
app.post("/registration", async (req, res) => {

    const data = req.body;
    console.log("Received Registration Data: " + data)

    if (!data) {
        return res.status(400).json({ error: "No data received" });
    }

    // Add Student to database and return him

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

const port = 5100;
app.listen(port, console.log("Listening on port " + port + "..."))