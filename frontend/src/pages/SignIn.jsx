import axios from "axios";
import { useState } from "react";
import "./SignIn.css";
import { useNavigate } from "react-router-dom";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError(""); // Clear error when user types
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(""); // Clear error when user types
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    // Validate empty fields
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    let user = {
      email: email,
      password: password,
    };

    try {
      const response = await axios.post(
        "http://localhost:5100/auth/login",
        user
      );
      localStorage.setItem("currentUser", JSON.stringify(response.data));
      navigate("/dashboard/study-plan");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          setError("Invalid email or password");
        } else if (error.response.status === 400) {
          setError("Please provide both email and password");
        } else {
          setError("An error occurred. Please try again later.");
        }
      } else if (error.request) {
        setError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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
          {error && (
            <div className="error-message" style={{
              color: '#dc2626',
              backgroundColor: '#fee2e2',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="form-input"
            onChange={handleEmailChange}
            value={email}
          />
          <label htmlFor="Password" className="form-label">
            Password
          </label>
          <input
            type="password"
            id="Password"
            className="form-input"
            onChange={handlePasswordChange}
            value={password}
          />
          <button type="submit" href="sign-in" className="btn cursor-pointer">
            Sign in
          </button>
          <p className="new-to-aspg">
            New to ASPG?{" "}
            <a href="#" className="go-to-reg" onClick={() => navigate("/signup")}>
              Create account
            </a>
          </p>
        </form>
      </section>
    </div>
  );
}

export default SignIn;
