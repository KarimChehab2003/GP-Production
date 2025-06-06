import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function generateSchedule(collegeSchedule, externalActivities, courses) {
    return new Promise((resolve, reject) => {
        try {
            // Convert the data to JSON string
            const data = JSON.stringify({
                college_schedule: collegeSchedule,
                external_activities: externalActivities,
                courses: courses
            });

            // Get the absolute path to the Python script
            const workspaceRoot = 'C:/Users/alyye/OneDrive/Desktop/gp/project/GP-Production';
            const pythonScriptPath = path.join(workspaceRoot, 'backend', 'python-scripts', 'CP', 'CP.py');

            // Check if Python script exists
            if (!fs.existsSync(pythonScriptPath)) {
                throw new Error(`Python script not found at: ${pythonScriptPath}`);
            }

            // Get the absolute path to Python executable
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

            // Spawn Python process with full error handling
            const pythonProcess = spawn(pythonCommand, [pythonScriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true, // Use shell to ensure Python is found
                cwd: path.dirname(pythonScriptPath) // Set working directory to script location
            });

            let result = '';
            let error = '';

            // Handle Python script output
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                result += output;
            });

            // Handle Python script errors
            pythonProcess.stderr.on('data', (data) => {
                const errorOutput = data.toString();
                error += errorOutput;
            });

            // Handle process completion
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python process exited with code ${code}: ${error}`));
                    return;
                }

                try {
                    if (!result) {
                        throw new Error('No output received from Python script');
                    }
                    
                    // Extract the JSON part from the output
                    const jsonMatch = result.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('No JSON object found in Python output');
                    }
                    
                    const scheduleData = JSON.parse(jsonMatch[0]);
                    resolve(scheduleData);
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${e.message}`));
                }
            });

            // Handle process errors
            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to start Python process: ${err.message}`));
            });

            // Send data to Python script
            pythonProcess.stdin.write(data);
            pythonProcess.stdin.end();

        } catch (error) {
            reject(error);
        }
    });
}