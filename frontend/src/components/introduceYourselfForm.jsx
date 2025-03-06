const IntroduceYourselfForm = ({
  createdUser,
  setCreatedUser,
  handleNext,
  handlePrevious,
}) => {
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
                onChange={(e) =>
                  setCreatedUser((prevState) => ({
                    ...prevState,
                    extracurricularActivities: e.target.value,
                  }))
                }
              >
                <option value="" hidden>
                  Select
                </option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
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
