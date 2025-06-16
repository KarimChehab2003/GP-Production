import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function CreateAccountForm({ createdUser, setCreatedUser, handleNext }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

  const checkEmailAvailability = async (email) => {
    try {
      const response = await axios.post("http://localhost:5100/auth/check-email", { email });
      return response.data;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // First name validation
    if (!createdUser.fname?.trim()) {
      newErrors.fname = "First name is required";
    }

    // Last name validation
    if (!createdUser.lname?.trim()) {
      newErrors.lname = "Last name is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!createdUser.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(createdUser.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!createdUser.password) {
      newErrors.password = "Password is required";
    } else {
      const hasUpperCase = /[A-Z]/.test(createdUser.password);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(createdUser.password);
      const isLongEnough = createdUser.password.length >= 8;

      if (!isLongEnough) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!hasUpperCase) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!hasSymbol) {
        newErrors.password = "Password must contain at least one special character";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const isAvailable = await checkEmailAvailability(createdUser.email);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, email: "This email is already taken" }));
        return;
      }
      handleNext();
    }
  };

  return (
    <div className="max-w-md w-full px-12 py-5 rounded-md shadow-xl bg-white">
      <div className="flex flex-col justify-between items-start space-y-10">
        <h2 className="text-2xl font-semibold my-6 charcoal">
          Create your account
        </h2>

        <form className="w-full space-y-4" onSubmit={handleNextClick}>
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">First name</label>
            <input
              type="text"
              className={`border-2 ${
                errors.fname ? "border-red-500" : "border-gray-200"
              } rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300`}
              value={createdUser.fname || ""}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  fname: e.target.value,
                }))
              }
            />
            {errors.fname && (
              <span className="text-red-500 text-sm">{errors.fname}</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Last name</label>
            <input
              type="text"
              className={`border-2 ${
                errors.lname ? "border-red-500" : "border-gray-200"
              } rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300`}
              value={createdUser.lname || ""}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  lname: e.target.value,
                }))
              }
            />
            {errors.lname && (
              <span className="text-red-500 text-sm">{errors.lname}</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Email</label>
            <input
              type="email"
              className={`border-2 ${
                errors.email ? "border-red-500" : "border-gray-200"
              } rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300`}
              value={createdUser.email || ""}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  email: e.target.value,
                }))
              }
            />
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email}</span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium charcoal">Password</label>
            <input
              type="password"
              className={`border-2 ${
                errors.password ? "border-red-500" : "border-gray-200"
              } rounded-lg p-2 outline-none focus:border-indigo-500 transition-color duration-300`}
              value={createdUser.password || ""}
              onChange={(e) =>
                setCreatedUser((prevState) => ({
                  ...prevState,
                  password: e.target.value,
                }))
              }
            />
            {errors.password && (
              <span className="text-red-500 text-sm">{errors.password}</span>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters long and contain:
              <ul className="list-disc list-inside">
                <li>At least one uppercase letter</li>
                <li>At least one special character</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className="w-full block text-white font-semibold bg-indigo-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
          >
            Next
          </button>
        </form>

        <p className="mx-auto text-sm font-medium charcoal">
          Already have an account ?{" "}
          <span
            className="text-indigo-500 cursor-pointer hover:text-indigo-300 transition"
            onClick={() => navigate("/login")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default CreateAccountForm;
