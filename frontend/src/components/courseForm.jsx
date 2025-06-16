import { useState } from "react";

const CourseForm = ({
  createdUser,
  setCreatedUser,
  handlePrevious,
  handleSubmit,
}) => {
  const criteria = ["Computation", "Memorization", "Creativity", "Analysis"];
  const [numCourses, setNumCourses] = useState(0);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validate number of courses
    if (!numCourses || numCourses < 1 || numCourses > 12) {
      newErrors.numCourses = "Number of courses must not be less than 1 or greater than 12";
    }

    // Track all time slots to check for conflicts
    const allTimeSlots = [];

    // Validate each course
    courses.forEach((course, courseIndex) => {
      // Validate course name
      if (!course.courseName?.trim()) {
        newErrors[`course_${courseIndex}_name`] = "Course name is required";
      }

      // Validate CMCA scores
      criteria.forEach((criterion) => {
        if (!course.scores[criterion]) {
          newErrors[`course_${courseIndex}_${criterion}`] = `${criterion} rating is required`;
        }
      });

      // Validate time slots and check for conflicts
      course.timeSlots.forEach((slot, slotIndex) => {
        if (!slot.day) {
          newErrors[`course_${courseIndex}_slot_${slotIndex}_day`] = "Day is required";
        }
        if (!slot.timeslot) {
          newErrors[`course_${courseIndex}_slot_${slotIndex}_timeslot`] = "Time slot is required";
        }

        // If both day and timeslot are selected, check for conflicts
        if (slot.day && slot.timeslot) {
          const timeSlotKey = `${slot.day}-${slot.timeslot}`;
          
          // Check if this time slot is already used
          const existingSlot = allTimeSlots.find(
            existing => existing.timeSlotKey === timeSlotKey
          );

          if (existingSlot) {
            // Add error for both the current slot and the conflicting slot
            newErrors[`course_${courseIndex}_slot_${slotIndex}_conflict`] = 
              `Time slot conflict with ${existingSlot.courseName} (${existingSlot.type})`;
            newErrors[`course_${existingSlot.courseIndex}_slot_${existingSlot.slotIndex}_conflict`] = 
              `Time slot conflict with ${course.courseName} (${slot.type})`;
          } else {
            // Add this time slot to the tracking array
            allTimeSlots.push({
              timeSlotKey,
              courseIndex,
              slotIndex,
              courseName: course.courseName,
              type: slot.type
            });
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNumCoursesChange = (e) => {
    const num = parseInt(e.target.value, 10) || 0;
    setNumCourses(num);
    setCourses(
      new Array(num).fill().map(() => ({
        courseName: "",
        scores: { Computation: 1, Memorization: 1, Creativity: 1, Analysis: 1 },
        timeSlots: [{ day: "", timeslot: "", type: "Lecture" }],
      }))
    );
    // Clear errors when number of courses changes
    setErrors({});
  };

  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
    // Clear error for this field when it changes
    if (errors[`course_${index}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`course_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const handleScoreChange = (courseIndex, criterion, value) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].scores[criterion] = value;
    setCourses(updatedCourses);
    // Clear error for this criterion when it changes
    if (errors[`course_${courseIndex}_${criterion}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`course_${courseIndex}_${criterion}`];
        return newErrors;
      });
    }
  };

  const handleTimeSlotChange = (courseIndex, slotIndex, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].timeSlots[slotIndex][field] = value;
    setCourses(updatedCourses);
    // Clear error for this time slot field when it changes
    if (errors[`course_${courseIndex}_slot_${slotIndex}_${field}`] || 
        errors[`course_${courseIndex}_slot_${slotIndex}_conflict`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`course_${courseIndex}_slot_${slotIndex}_${field}`];
        delete newErrors[`course_${courseIndex}_slot_${slotIndex}_conflict`];
        return newErrors;
      });
    }
  };

  const addTimeSlot = (courseIndex) => {
    const updatedCourses = [...courses];
    updatedCourses[courseIndex].timeSlots.push({ day: "", timeslot: "" });
    setCourses(updatedCourses);
  };

  const removeTimeSlot = (courseIndex, slotIndex) => {
    const updatedCourses = [...courses];

    // Ensure at least one timeslot remains
    if (updatedCourses[courseIndex].timeSlots.length > 1) {
      updatedCourses[courseIndex].timeSlots.splice(slotIndex, 1);
      setCourses(updatedCourses);
    } else {
      alert("Each course must have at least one timeslot.");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const updatedUser = { ...createdUser, courses: courses };
      setCreatedUser(updatedUser);
      handleSubmit(e, updatedUser);
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-md my-4 mx-2 sm:mx-auto"
    >
      <h2 className="text-2xl font-semibold mb-2 text-center">
        Course Details
      </h2>
      <p className="text-gray-600 text-center text-sm mb-6">
        Enter details about the courses you're currently enrolled in at your
        College or University.
      </p>

      {/* Number of Courses */}
      <div>
        <label className="block font-medium">Number of Courses:</label>
        <input
          type="number"
          value={numCourses}
          onChange={handleNumCoursesChange}
          min="1"
          max="12"
          className={`border p-2 w-full mt-1 rounded-lg ${
            errors.numCourses ? "border-red-500" : "border-gray-300"
          } outline-none focus:border-indigo-500 transition-color duration-300`}
        />
        {errors.numCourses && (
          <span className="text-red-500 text-sm">{errors.numCourses}</span>
        )}
      </div>

      {courses.map((course, index) => (
        <div
          key={index}
          className="border border-gray-300 p-4 mt-4 rounded-lg shadow-md"
        >
          <h3 className="font-bold text-lg mb-2">Course {index + 1}</h3>
          {/* Two-Column Layout for Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <div>
              <label className="block font-medium">Course Name:</label>
              <input
                type="text"
                value={course.courseName}
                onChange={(e) =>
                  handleCourseChange(index, "courseName", e.target.value)
                }
                className={`border p-2 w-full mt-1 rounded-lg ${
                  errors[`course_${index}_name`] ? "border-red-500" : "border-gray-300"
                } outline-none focus:border-indigo-500 transition-color duration-300`}
                placeholder="Enter Course Name"
              />
              {errors[`course_${index}_name`] && (
                <span className="text-red-500 text-sm">{errors[`course_${index}_name`]}</span>
              )}
            </div>
          </div>
          
          {/* CMCA Ratings */}
          <h4 className="font-semibold mt-3">Rate Each Criterion</h4>
          {criteria.map((criterion) => (
            <div key={criterion} className="mb-3">
              <label className="block font-medium">{criterion}</label>
              <div className="flex space-x-2 mt-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <label key={score} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={`${criterion}-${index}`}
                      value={score}
                      checked={course.scores[criterion] === score}
                      onChange={() =>
                        handleScoreChange(index, criterion, score)
                      }
                      className="hidden"
                    />
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer border transition ${
                        course.scores[criterion] === score
                          ? "bg-indigo-500 text-white"
                          : "border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {score}
                    </span>
                  </label>
                ))}
              </div>
              {errors[`course_${index}_${criterion}`] && (
                <span className="text-red-500 text-sm">{errors[`course_${index}_${criterion}`]}</span>
              )}
            </div>
          ))}

          {/* Lecture & Section Timeslots */}
          <h4 className="font-semibold mt-3">Lecture & Section Timeslots</h4>
          {course.timeSlots.map((slot, slotIndex) => (
            <div
              key={slotIndex}
              className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
            >
              {/* Type Dropdown */}
              <div>
                <label className="block font-medium">Type:</label>
                <select
                  value={slot.type}
                  onChange={(e) =>
                    handleTimeSlotChange(
                      index,
                      slotIndex,
                      "type",
                      e.target.value
                    )
                  }
                  className="border p-2 w-full mt-1 rounded-lg border-gray-300 outline-none focus:border-indigo-500 transition-color duration-300"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Section">Section</option>
                </select>
              </div>

              {/* Day Input */}
              <div>
                <label className="block font-medium">Day:</label>
                <select
                  value={slot.day}
                  onChange={(e) =>
                    handleTimeSlotChange(
                      index,
                      slotIndex,
                      "day",
                      e.target.value
                    )
                  }
                  className={`border p-2 w-full mt-1 rounded-lg ${
                    errors[`course_${index}_slot_${slotIndex}_day`] || 
                    errors[`course_${index}_slot_${slotIndex}_conflict`] 
                      ? "border-red-500" 
                      : "border-gray-300"
                  } outline-none focus:border-indigo-500 transition-color duration-300`}
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
                {errors[`course_${index}_slot_${slotIndex}_day`] && (
                  <span className="text-red-500 text-sm">{errors[`course_${index}_slot_${slotIndex}_day`]}</span>
                )}
                {errors[`course_${index}_slot_${slotIndex}_conflict`] && (
                  <span className="text-red-500 text-sm">{errors[`course_${index}_slot_${slotIndex}_conflict`]}</span>
                )}
              </div>

              {/* Timeslot Input */}
              <div>
                <label className="block font-medium">Timeslot:</label>
                <select
                  value={slot.timeslot}
                  onChange={(e) =>
                    handleTimeSlotChange(
                      index,
                      slotIndex,
                      "timeslot",
                      e.target.value
                    )
                  }
                  className={`border p-2 w-full mt-1 rounded-lg ${
                    errors[`course_${index}_slot_${slotIndex}_timeslot`] || 
                    errors[`course_${index}_slot_${slotIndex}_conflict`]
                      ? "border-red-500" 
                      : "border-gray-300"
                  } outline-none focus:border-indigo-500 transition-color duration-300`}
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
                {errors[`course_${index}_slot_${slotIndex}_timeslot`] && (
                  <span className="text-red-500 text-sm">{errors[`course_${index}_slot_${slotIndex}_timeslot`]}</span>
                )}
              </div>

              {/* Remove Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeTimeSlot(index, slotIndex)}
                  className="bg-red-500 text-white px-3 py-1 rounded-md mt-6 hover:bg-red-600 transition"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {/* Add Time Slot Button */}
          <button
            type="button"
            onClick={() => addTimeSlot(index)}
            className="text-indigo-500 font-medium mt-2 hover:underline"
          >
            + Add Time Slot
          </button>
        </div>
      ))}

      <div className="text-center flex justify-between items-center space-x-2 mt-8">
        <button
          type="button"
          className="w-full block text-white font-semibold bg-gray-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
          onClick={handlePrevious}
        >
          Previous
        </button>
        <button
          type="submit"
          className="w-full block text-white font-semibold bg-indigo-400 px-3 py-2 rounded-md cursor-pointer hover:-translate-y-1 transition duration-300"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default CourseForm;
