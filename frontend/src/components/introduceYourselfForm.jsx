import { useState, useEffect } from "react";

const IntroduceYourselfForm = ({
  createdUser,
  setCreatedUser,
  handleNext,
  handlePrevious,
}) => {
  
  const [hasExtracurricular, setHasExtracurricular] = useState(false);
  const [extracurricularActivities, setExtracurricularActivities] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setCreatedUser((prevState) => ({
      ...prevState,
      takesCurricularActivities: "No",
      extracurricularActivities: [],
    }));
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // GPA Validation
    const gpa = parseFloat(createdUser.previousTermGPA);
    if (!createdUser.previousTermGPA) {
      newErrors.previousTermGPA = "Previous term GPA is required";
    } else if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
      newErrors.previousTermGPA = "GPA must be between 0 and 4.0";
    }

    // Cumulative GPA Validation
    const cgpa = parseFloat(createdUser.cgpa);
    if (!createdUser.cgpa) {
      newErrors.cgpa = "Cumulative GPA is required";
    } else if (isNaN(cgpa) || cgpa < 0 || cgpa > 4.0) {
      newErrors.cgpa = "Cumulative GPA must be between 0 and 4.0";
    }

    // Learning Support Validation
    if (!createdUser.accessToResources) {
      newErrors.accessToResources = "Please select access to resources";
    }

    if (!createdUser.tutoringSessions) {
      newErrors.tutoringSessions = "Number of tutoring sessions is required";
    }

    // Extracurricular Activities Validation
    if (hasExtracurricular) {
      // Check for time slot conflicts
      const timeSlots = new Map(); // Map to store day-time combinations

      extracurricularActivities.forEach((activity, index) => {
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
    }

    // Personal & Environmental Factors Validation
    if (!createdUser.distanceFromHome) {
      newErrors.distanceFromHome = "Please select distance from home";
    }

    // Sleep Hours Validation
    const sleepHours = parseInt(createdUser.sleepingHours);
    if (!createdUser.sleepingHours) {
      newErrors.sleepingHours = "Sleep hours is required";
    } else if (isNaN(sleepHours) || sleepHours < 1 || sleepHours > 18) {
      newErrors.sleepingHours = "Sleep hours must be between 1 and 18";
    }

    if (!createdUser.parentalEducationLevel) {
      newErrors.parentalEducationLevel = "Please select parental education level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = (e) => {
    e.preventDefault();
    if (validateForm()) {
      handleNext();
    }
  };

  const handleAddActivity = () => {
    setExtracurricularActivities([
      ...extracurricularActivities,
      { name: "", day: "", time: "", place: "" },
    ]);
  };

  const handleActivityChange = (index, key, value) => {
    const updatedActivities = extracurricularActivities.map((activity, i) =>
      i === index ? { ...activity, [key]: value } : activity
    );

    setExtracurricularActivities(updatedActivities);
    setCreatedUser((prevState) => ({
      ...prevState,
      takesCurricularActivities: hasExtracurricular ? "Yes" : "No",
      extracurricularActivities: updatedActivities,
    }));

    // Clear time slot conflict errors when changing time or day
    if (key === 'time' || key === 'day') {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[`activity_${index}_time`];
        // Also clear any conflict errors for other activities
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
      setExtracurricularActivities([
        { name: "", day: "", time: "", place: "" },
      ]);
    } else {
      setExtracurricularActivities([]);
    }
    setCreatedUser((prevState) => ({
      ...prevState,
      takesCurricularActivities: hasActivities ? "Yes" : "No",
      extracurricularActivities: hasActivities ? [{ name: "", day: "", time: "", place: "" }] : [],
    }));
  };

  return (
    <div className="max-w-xl w-full bg-white mx-4 p-6 rounded-md shadow-xl sm:my-10">
      <h2 className="text-2xl font-bold text-center capitalize">
        Introduce yourself to us
      </h2>
      <p className="text-gray-600 text-center text-sm mb-6">
        Please answer the following questions...
      </p>

      <form className="space-y-6" onSubmit={handleNextClick}>
        {/* Academic Information */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <p className="font-semibold text-lg">📘 Academic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium">
                GPA of previous term:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={createdUser.previousTermGPA || ""}
                className={`mt-1 w-full p-2 border ${
                  errors.previousTermGPA ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    previousTermGPA: e.target.value,
                  }))
                }
              />
              {errors.previousTermGPA && (
                <span className="text-red-500 text-sm">{errors.previousTermGPA}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Cumulative GPA:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={createdUser.cgpa || ""}
                className={`mt-1 w-full p-2 border ${
                  errors.cgpa ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    cgpa: e.target.value,
                  }))
                }
              />
              {errors.cgpa && (
                <span className="text-red-500 text-sm">{errors.cgpa}</span>
              )}
            </div>
          </div>
        </div>

        {/* Learning Support */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <p className="font-semibold text-lg">📚 Learning Support</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium">
                Access to Resources:
              </label>
              <select
                className={`mt-1 w-full p-2 border ${
                  errors.accessToResources ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                value={createdUser.accessToResources || ""}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    accessToResources: e.target.value,
                  }))
                }
              >
                <option value="" hidden>
                  Select
                </option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.accessToResources && (
                <span className="text-red-500 text-sm">{errors.accessToResources}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Number of Tutoring Sessions:
              </label>
              <input
                type="number"
                min="0"
                value={createdUser.tutoringSessions || ""}
                className={`mt-1 w-full p-2 border ${
                  errors.tutoringSessions ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    tutoringSessions: e.target.value,
                  }))
                }
              />
              {errors.tutoringSessions && (
                <span className="text-red-500 text-sm">{errors.tutoringSessions}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Are you in any extracurriculars?
              </label>
              <select
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                value={hasExtracurricular ? "Yes" : "No"}
                onChange={(e) => handleExtracurricularToggle(e.target.value)}
              >
                <option value="" hidden>
                  Select
                </option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Activity Fields */}
            {hasExtracurricular && (
              <div className="mt-4">
                {extracurricularActivities.map((activity, index) => (
                  <div key={index} className="flex flex-col gap-2 mb-4">
                    <input
                      type="text"
                      value={activity.name}
                      placeholder="Enter activity name"
                      className={`w-full p-2 border ${
                        errors[`activity_${index}_name`] ? "border-red-500" : "border-gray-300"
                      } rounded-lg`}
                      onChange={(e) =>
                        handleActivityChange(index, "name", e.target.value)
                      }
                    />
                    {errors[`activity_${index}_name`] && (
                      <span className="text-red-500 text-sm">{errors[`activity_${index}_name`]}</span>
                    )}
                    <select
                      value={activity.day}
                      onChange={(e) =>
                        handleActivityChange(index, "day", e.target.value)
                      }
                      className={`w-full p-2 border ${
                        errors[`activity_${index}_day`] ? "border-red-500" : "border-gray-300"
                      } rounded-lg`}
                    >
                      <option value="" hidden>
                        Select a day
                      </option>
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
                      className={`mt-1 w-full p-2 border ${
                        errors[`activity_${index}_time`] ? "border-red-500" : "border-gray-300"
                      } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                      value={activity.time}
                      onChange={(e) =>
                        handleActivityChange(index, "time", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleActivityChange(index, "place", e.target.value)
                      }
                      className={`w-full p-2 border ${
                        errors[`activity_${index}_place`] ? "border-red-500" : "border-gray-300"
                      } rounded-lg`}
                    >
                      <option value="" hidden>
                        Select a location
                      </option>
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
                  className="text-indigo-400 text-sm font-semibold mt-2"
                  onClick={handleAddActivity}
                >
                  + Add Another Activity
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal & Environmental Factors */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <p className="font-semibold text-lg">
            🏡 Personal & Environmental Factors
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium">
                Home-to-college distance?
              </label>
              <select
                className={`mt-1 w-full p-2 border ${
                  errors.distanceFromHome ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                value={createdUser.distanceFromHome || ""}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    distanceFromHome: e.target.value,
                  }))
                }
              >
                <option value="" hidden>
                  Select
                </option>
                <option value="Near">Near</option>
                <option value="Moderate">Moderate</option>
                <option value="Far">Far</option>
              </select>
              {errors.distanceFromHome && (
                <span className="text-red-500 text-sm">{errors.distanceFromHome}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Your average sleep hours?
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={createdUser.sleepingHours || ""}
                className={`mt-1 w-full p-2 border ${
                  errors.sleepingHours ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    sleepingHours: e.target.value,
                  }))
                }
              />
              {errors.sleepingHours && (
                <span className="text-red-500 text-sm">{errors.sleepingHours}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Parental Education Level:
              </label>
              <select
                className={`mt-1 w-full p-2 border ${
                  errors.parentalEducationLevel ? "border-red-500" : "border-gray-300"
                } rounded-lg outline-none focus:border-indigo-500 transition-color duration-300`}
                value={createdUser.parentalEducationLevel || ""}
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    parentalEducationLevel: e.target.value,
                  }))
                }
              >
                <option value="" hidden>
                  Select
                </option>
                <option value="High School">High School</option>
                <option value="college">College</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
              {errors.parentalEducationLevel && (
                <span className="text-red-500 text-sm">{errors.parentalEducationLevel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Next & Previous Buttons */}
        <div className="text-center flex justify-between items-center space-x-2">
          <button
            className="w-full block text-white font-semibold bg-gray-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
            onClick={handlePrevious}
          >
            Previous
          </button>
          <button
            type="submit"
            className="w-full block text-white font-semibold bg-indigo-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntroduceYourselfForm;
