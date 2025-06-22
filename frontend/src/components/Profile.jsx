import { useState, useEffect } from "react";
import axios from "axios";

function Profile() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        oldPassword: "",
        password: "",
        confirmPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser) {
            setFormData({
                firstName: currentUser.fname || "",
                lastName: currentUser.lname || "",
                email: currentUser.email || "",
                oldPassword: "",
                password: "",
                confirmPassword: ""
            });
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (formData.password) {
            if (!formData.oldPassword) {
                newErrors.oldPassword = "Old password is required to set a new one";
            } else if (currentUser && formData.oldPassword !== currentUser.password) {
                newErrors.oldPassword = "Old password does not match";
            }

            if (formData.password.length < 8) {
                newErrors.password = "Password must be at least 8 characters long.";
            } else if (!/[A-Z]/.test(formData.password)) {
                newErrors.password = "Password must contain at least one capital letter.";
            } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
                newErrors.password = "Password must contain at least one symbol.";
            }
            
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsUpdating(true);
            setErrors({});
            setSuccessMessage("");
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));

            try {
                // 1. Check if email is available (if it has been changed)
                if (formData.email !== currentUser.email) {
                    const emailRes = await axios.post("http://localhost:5100/auth/check-email", {
                        email: formData.email,
                    });
                    if (!emailRes.data) {
                        setErrors({ email: "This email is already taken." });
                        setIsUpdating(false);
                        return;
                    }
                }

                // 2. Call the update-profile endpoint
                const updateRes = await axios.post("http://localhost:5100/student/update-profile", {
                    userId: currentUser.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password || currentUser.password, // Send new or old password
                });

                // 3. Update local storage
                const updatedUser = {
                    ...currentUser,
                    fname: formData.firstName,
                    lname: formData.lastName,
                    email: formData.email,
                    password: formData.password || currentUser.password,
                };
                localStorage.setItem("currentUser", JSON.stringify(updatedUser));

                // 4. Show success and refresh after 2 seconds
                setSuccessMessage("Profile updated successfully!");
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Error updating profile:", error);
                setErrors({ submit: error.response?.data?.error || "An unexpected error occurred." });
            } finally {
                setIsUpdating(false);
            }
        }
    };

    return (
        <form
            onSubmit={handleUpdate}
            className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg space-y-6"
        >
            <h2 className="text-3xl font-bold text-center text-gray-800">
                Update Profile
            </h2>

            <div>
                <label className="block font-medium text-gray-700">First Name</label>
                <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Enter your first name"
                />
                {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName}</span>}
            </div>

            <div>
                <label className="block font-medium text-gray-700">Last Name</label>
                <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Enter your last name"
                />
                {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName}</span>}
            </div>

            <div>
                <label className="block font-medium text-gray-700">Email Address</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.email ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Enter your email"
                />
                {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            </div>

            <hr />

            <p className="text-sm text-gray-500 text-center">
                Only fill out the fields below if you want to change your password.
            </p>

            <div>
                <label className="block font-medium text-gray-700">Old Password</label>
                <input
                    type="password"
                    name="oldPassword"
                    value={formData.oldPassword}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.oldPassword ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Enter your old password"
                />
                {errors.oldPassword && <span className="text-red-500 text-sm">{errors.oldPassword}</span>}
            </div>

            <div>
                <label className="block font-medium text-gray-700">New Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.password ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Enter new password"
                />
                {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
            </div>

            <div>
                <label className="block font-medium text-gray-700">Confirm New Password</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`border p-3 w-full mt-1 rounded-lg ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    } outline-none focus:border-indigo-500 transition-colors duration-300`}
                    placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
            </div>
            
            <div className="text-center pt-4">

                <div className="text-center mb-3">
                    {errors.submit && <p className="text-red-500 text-sm mb-2">{errors.submit}</p>}
                    {successMessage && <p className="text-green-600 text-sm mb-2">{successMessage}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isUpdating}
                    className={`w-full text-white font-semibold px-4 py-3 rounded-lg transition duration-300 ${
                        isUpdating
                            ? "bg-indigo-300 cursor-not-allowed"
                            : "bg-indigo-500 hover:bg-indigo-600"
                    }`}
                >
                    {isUpdating ? "Updating..." : "Update Info"}
                </button>
            </div>
        </form>
    );
}

export default Profile;