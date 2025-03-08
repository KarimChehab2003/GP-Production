import { useState } from "react";

const IntroduceYourselfForm = ({
  createdUser,
  setCreatedUser,
  handleNext,
  handlePrevious,
}) => {
  const [hasExtracurricular, setHasExtracurricular] = useState(false);
  const [extracurricularActivities, setExtracurricularActivities] = useState(
    {}
  );

  const handleAddActivity = () => {
    setExtracurricularActivities([
      ...extracurricularActivities,
      { name: "", day: "", time: "" },
    ]);
  };

  const handleActivityChange = (index, key, value) => {
    const updatedActivities = extracurricularActivities.map((activity, i) =>
      i === index ? { ...activity, [key]: value } : activity
    );

    setExtracurricularActivities(updatedActivities);
    setCreatedUser((prevState) => ({
      ...prevState,
      extracurricularActivities: updatedActivities,
    }));
    // console.log(extracurricularActivities);
  };

  return (
    <div className="max-w-xl w-full bg-white mx-4 p-6 rounded-md shadow-xl sm:my-10">
      <h2 className="text-2xl font-bold text-center capitalize">
        Introduce yourself to us
      </h2>
      <p className="text-gray-600 text-center text-sm mb-6">
        Please answer the following questions...
      </p>

      <form className="space-y-6">
        {/* Academic Information */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <p className="font-semibold text-lg">📘 Academic Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium">
                GPA of previous term:
              </label>
              <input
                type="text"
                value={createdUser.previousTermGPA}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    previousTermGPA: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Cumulative GPA:
              </label>
              <input
                type="text"
                value={createdUser.cgpa}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    cgpa: e.target.value,
                  }))
                }
              />
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
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
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
            </div>
            <div>
              <label className="block text-sm font-medium">
                Number of Tutoring Sessions:
              </label>
              <input
                type="text"
                value={createdUser.tutoringSessions}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    tutoringSessions: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Are you in any extracurriculars?
              </label>
              <select
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                value={hasExtracurricular ? "Yes" : "No"}
                onChange={(e) => {
                  setHasExtracurricular(e.target.value === "Yes");
                  if (e.target.value === "Yes") {
                    setExtracurricularActivities([
                      { name: "", day: "", time: "" },
                    ]);
                  } else {
                    setExtracurricularActivities([]);
                    setCreatedUser((prevState) => ({
                      ...prevState,
                      extracurricularActivities: [],
                    }));
                  }
                }}
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
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      onChange={(e) =>
                        handleActivityChange(index, "name", e.target.value)
                      }
                    />
                    <select
                      value={activity.day}
                      onChange={(e) =>
                        handleActivityChange(index, "day", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
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

                    {/* Dropdown for time slots */}
                    <select
                      className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
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
                      <option value="10PM-12AM">10PM - 12AM</option>
                    </select>
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
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
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
            </div>
            <div>
              <label className="block text-sm font-medium">
                Your average sleep hours?
              </label>
              <input
                type="text"
                value={createdUser.sleepingHours}
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    sleepingHours: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Parental Education Level:
              </label>
              <select
                className="mt-1 w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 transition-color duration-300"
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
                <option value="College">College</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
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
            className="w-full block text-white font-semibold bg-indigo-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
};

export default IntroduceYourselfForm;
