import axios from "axios";
import { useState } from "react";
import "./SignIn.css";
import { useNavigate } from "react-router-dom";

function SignIn({ setCurrentUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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

    // console.log(user);

    try {
      const response = await axios.post(
        "http://localhost:5100/auth/login",
        user
      );
      // console.log(response.data);
      setCurrentUser(response.data);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="sign-in-wrapper">
      <div className="gradient">
        <header className="header container">
          <p className="logo">
            <a href="#" className="logo-link">
              ASPG
            </a>
          </p>
        </header>
      </div>
      <section className="sign-in-section">
        <form className="sign-in-form container" onSubmit={(e) => onSubmit(e)}>
          <p className="sign-text">Sign in to your account</p>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="form-input"
            onChange={handleEmailChange}
          />
          <p className="forget-container">
            <span>Password</span>
            <span>
              <a href="#" className="forgot-password">
                Forgot your Password?
              </a>
            </span>
          </p>
          <input
            type="password"
            id="Password"
            className="form-input"
            onChange={handlePasswordChange}
          />
          <div className="remember-me">
            <input type="checkbox" id="remember" className="check-form-label" />
            <label htmlFor="remember" className="remember-me-text">
              Remember me on this device
            </label>
          </div>
          <button type="submit" href="sign-in" className="btn cursor-pointer">
            Sign in
          </button>
          <p className="new-to-aspg">
            New to ASPG?{" "}
            <a href="#" className="go-to-reg" onClick={() => navigate("/")}>
              Create account
            </a>
          </p>
        </form>
      </section>
    </div>
  );
}

export default SignIn;
