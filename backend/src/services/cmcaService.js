import { PythonShell } from "python-shell";

export const predictCMCA = async (courses, hoursPerWeek) => {
    const jsonData = JSON.stringify(courses);

    let options = {
        mode: "text",
        pythonOptions: ["-u"],
        scriptPath: "./python-scripts",
        args: [String(hoursPerWeek)]
    };

    // console.log(courses);

    return new Promise((resolve, reject) => {
        const pyshell = new PythonShell("predictCMCA.py", options);
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
