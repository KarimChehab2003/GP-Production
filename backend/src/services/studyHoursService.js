import { PythonShell } from "python-shell";

export const predictStudyHours = async (features) => {
    const jsonData = JSON.stringify(features);

    let options = {
        mode: "text",
        pythonOptions: ["-u"],
        scriptPath: "./python-scripts",
    };

    return new Promise((resolve, reject) => {
        let result = "";

        const pyshell = new PythonShell("predictStudyHours.py", options);
        pyshell.send(jsonData);

        pyshell.on("message", (message) => {
            result += message;
        });

        pyshell.on("error", reject);

        pyshell.end((err) => {
            if (err) return reject(err);
            try {
                resolve(JSON.parse(result));
            } catch (parseErr) {
                reject(parseErr);
            }
        });
    });
};
