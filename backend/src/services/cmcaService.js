import { PythonShell } from "python-shell";

export const predictCMCA = async (courses) => {
    const jsonData = JSON.stringify(courses.map(course => course.scores));

    let options = {
        mode: "text",
        pythonOptions: ["-u"],
        scriptPath: "../python-scripts",
    };

    return new Promise((resolve, reject) => {
        const pyshell = new PythonShell("test.py", options);
        pyshell.send(jsonData);

        let result = "";

        pyshell.on("message", (message) => result += message);
        pyshell.on("error", reject);
        pyshell.end((err) => {
            if (err) reject(err);
            try {
                resolve(JSON.parse(result));
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
};
