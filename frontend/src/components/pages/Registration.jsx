import axios from "axios";
import { useState } from "react";

function Registration() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [fname , setFname] = useState("");
const [lname , setLname] = useState("");

const handleEmailChange = (e) => {
    setEmail(e.target.value);
};
const handlePasswordChange = (e) => {
    setPassword(e.target.value);
};
const handleFnameChange = (e) => {
    setFname(e.target.value);
};
const handleLnameChange = (e) => {
    setLname(e.target.value);
};

const onSubmit = async (e) => {
    e.preventDefault();
    let user = {
    email: email,
    password: password,
    fname : fname,
    lname : lname
    };

    console.log(user);

    try {
    const response = await axios.post("http://localhost:5100/registration1", user);
    console.log(response.data);
    } catch (error) {
    console.error(error);
    }
};

return (
    <div className="min-h-screen flex justify-center items-center ">
    <form
        onSubmit={(e) => {
        onSubmit(e);
        }}
        className="flex flex-col space-y-4 border border-gray-600 rounded-md p-4"
    >
        <input
        type="text"
        onChange={handleEmailChange}
        placeholder="Email..."
        />
        <input
        type="password"
        onChange={handlePasswordChange}
        placeholder="Password..."
        />
        <input
        type="text"
        onChange={handleFnameChange}
        placeholder="Fname..."
        />
        <input
        type="text"
        onChange={handleLnameChange}
        placeholder="Lname..."
        />
        <button type="submit">Register</button>
    </form>
    </div>
);
}

export default Registration;
