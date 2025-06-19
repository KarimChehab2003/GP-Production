import { useState, useEffect } from "react";
import axios from "axios";

function ExternalActivities({ externalActivities, takesExternalActivities }) {
    const [hasExtracurricular, setHasExtracurricular] = useState(takesExternalActivities === "Yes");
    const [activities, setActivities] = useState(externalActivities || []);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (takesExternalActivities === "Yes" && (!activities || activities.length === 0)) {
            setActivities([{ name: "", day: "", time: "", place: "" }]);
        }
    }, [takesExternalActivities]);

    const validateForm = () => {
        const newErrors = {};
        const timeSlots = new Map();

        activities.forEach((activity, index) => {
            if (!activity.name) {
                newErrors[`activity_${index}_name`] = "Activity name is required";
            }
            if (!activity.day) {
                newErrors[`activity_${index}_day`] = "Day is required";
            }
            if (!activity.time) {
                newErrors[`activity_${index}_time`] = "Time slot is required";
            }
            if (!activity.place) {
                newErrors[`activity_${index}_place`] = "Location is required";
            }

            // Check for time slot conflicts
            if (activity.day && activity.time) {
                const timeSlotKey = `${activity.day}-${activity.time}`;
                if (timeSlots.has(timeSlotKey)) {
                    const conflictingIndex = timeSlots.get(timeSlotKey);
                    newErrors[`activity_${index}_time`] = `Time slot conflicts with activity ${conflictingIndex + 1}`;
                    newErrors[`activity_${conflictingIndex}_time`] = `Time slot conflicts with activity ${index + 1}`;
                } else {
                    timeSlots.set(timeSlotKey, index);
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddActivity = () => {
        setActivities([
            ...activities,
            { name: "", day: "", time: "", place: "" },
        ]);
    };

    const handleActivityChange = (index, key, value) => {
        const updatedActivities = activities.map((activity, i) =>
            i === index ? { ...activity, [key]: value } : activity
        );

        setActivities(updatedActivities);

        // Clear time slot conflict errors when changing time or day
        if (key === 'time' || key === 'day') {
            setErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                delete newErrors[`activity_${index}_time`];
                Object.keys(newErrors).forEach((errorKey) => {
                    if (errorKey.startsWith('activity_') && errorKey.endsWith('_time')) {
                        delete newErrors[errorKey];
                    }
                });
                return newErrors;
            });
        }
    };

    const handleExtracurricularToggle = (value) => {
        const hasActivities = value === "Yes";
        setHasExtracurricular(hasActivities);
        if (hasActivities) {
            setActivities([{ name: "", day: "", time: "", place: "" }]);
        } else {
            setActivities([]);
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setSuccessMessage("");
        try {
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            const { data } = await axios.post("http://localhost:5100/schedule/update-extracurricular", {
                userId: currentUser.id,
                extracurricularActivities: activities,
                takesCurricularActivities: hasExtracurricular ? "Yes" : "No"
            });
            
            // Update local storage with new timetable
            const updatedUser = {
                ...currentUser,
                extracurricularActivities: activities,
                takesCurricularActivities: hasExtracurricular ? "Yes" : "No",
                timetable: data.timetable
            };
            localStorage.setItem("currentUser", JSON.stringify(updatedUser));

            // Show success message
            setSuccessMessage("Schedule updated successfully!");
            
            // Refresh page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Error updating activities:', error);
            setErrors({ 
                submit: error.response?.data?.error || "Failed to update activities. Please try again." 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">External Activities</h2>
                <p className="text-gray-600">Manage your extracurricular activities and their schedules</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Are you in any extracurriculars?
                    </label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                        value={hasExtracurricular ? "Yes" : "No"}
                        onChange={(e) => handleExtracurricularToggle(e.target.value)}
                    >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>

                {hasExtracurricular && (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                                <input
                                    type="text"
                                    value={activity.name}
                                    placeholder="Enter activity name"
                                    className={`w-full p-2 border ${
                                        errors[`activity_${index}_name`] ? "border-red-500" : "border-gray-300"
                                    } rounded-lg`}
                                    onChange={(e) => handleActivityChange(index, "name", e.target.value)}
                                />
                                {errors[`activity_${index}_name`] && (
                                    <span className="text-red-500 text-sm">{errors[`activity_${index}_name`]}</span>
                                )}

                                <select
                                    value={activity.day}
                                    onChange={(e) => handleActivityChange(index, "day", e.target.value)}
                                    className={`w-full p-2 border ${
                                        errors[`activity_${index}_day`] ? "border-red-500" : "border-gray-300"
                                    } rounded-lg`}
                                >
                                    <option value="" hidden>Select a day</option>
                                    <option value="Sunday">Sunday</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                </select>
                                {errors[`activity_${index}_day`] && (
                                    <span className="text-red-500 text-sm">{errors[`activity_${index}_day`]}</span>
                                )}

                                <select
                                    className={`w-full p-2 border ${
                                        errors[`activity_${index}_time`] ? "border-red-500" : "border-gray-300"
                                    } rounded-lg`}
                                    value={activity.time}
                                    onChange={(e) => handleActivityChange(index, "time", e.target.value)}
                                >
                                    <option value="">Select a time slot</option>
                                    <option value="8AM-10AM">8AM - 10AM</option>
                                    <option value="10AM-12PM">10AM - 12PM</option>
                                    <option value="12PM-2PM">12PM - 2PM</option>
                                    <option value="2PM-4PM">2PM - 4PM</option>
                                    <option value="4PM-6PM">4PM - 6PM</option>
                                    <option value="6PM-8PM">6PM - 8PM</option>
                                    <option value="8PM-10PM">8PM - 10PM</option>
                                </select>
                                {errors[`activity_${index}_time`] && (
                                    <span className="text-red-500 text-sm">{errors[`activity_${index}_time`]}</span>
                                )}

                                <select
                                    value={activity.place}
                                    onChange={(e) => handleActivityChange(index, "place", e.target.value)}
                                    className={`w-full p-2 border ${
                                        errors[`activity_${index}_place`] ? "border-red-500" : "border-gray-300"
                                    } rounded-lg`}
                                >
                                    <option value="" hidden>Select a location</option>
                                    <option value="Outdoor">Outdoor</option>
                                    <option value="Indoor">Indoor</option>
                                </select>
                                {errors[`activity_${index}_place`] && (
                                    <span className="text-red-500 text-sm">{errors[`activity_${index}_place`]}</span>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            className="text-indigo-500 text-sm font-semibold hover:text-indigo-600 transition-colors"
                            onClick={handleAddActivity}
                        >
                            + Add Another Activity
                        </button>
                    </div>
                )}

                {errors.submit && (
                    <div className="text-red-500 text-sm mt-2">{errors.submit}</div>
                )}

                {successMessage && (
                    <div className="text-green-500 text-sm mt-2">{successMessage}</div>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        type="button"
                        className={`px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleSave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Updating...' : 'Update My Schedule'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExternalActivities;