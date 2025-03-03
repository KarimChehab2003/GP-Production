import axios from "axios";
import { useState } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    let user = {
      email: email,
      password: password,
    };

    console.log(user);

    try {
      const response = await axios.post("http://localhost:5100/login", user);
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
