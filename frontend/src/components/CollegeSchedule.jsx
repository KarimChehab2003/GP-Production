import { useState, useEffect } from "react";
import axios from "axios";

function CollegeSchedule({ enrolledCourses }) {
  const criteria = ["Computation", "Memorization", "Creativity", "Analysis"];
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursePromises = enrolledCourses.map((courseId) =>
          axios.get(`http://localhost:5100/api/courses/id?id=${courseId}`)
        );
        const courseResponses = await Promise.all(coursePromises);
        const fetchedCourses = courseResponses.map((response) => {
          const course = response.data;
          return {
            ...course,
            scores: course.cmca,
            timeSlots: course.LecturesAndSectionsTimeslots,
          };
        });
        setCourses(fetchedCourses);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };

    if (enrolledCourses && enrolledCourses.length > 0) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [enrolledCourses]);

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        courseName: "",
        scores: { Computation: 1, Memorization: 1, Creativity: 1, Analysis: 1 },
        timeSlots: [{ day: "", timeslot: "", type: "Lecture" }],
      },
    ]);
  };

  const removeCourse = (index) => {
    if (courses.length > 1) {
      const updatedCourses = [...courses];
      updatedCourses.splice(index, 1);
      setCourses(updatedCourses);
    } else {
      alert("You must have at least one course.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const allTimeSlots = [];

    courses.forEach((course, courseIndex) => {
      // Validate course name
      if (!course.courseName?.trim()) {
        newErrors[`course_${courseIndex}_name`] = "Course name is required";
      }

      // Validate CMCA scores
      criteria.forEach((criterion) => {
        if (!course.scores?.[criterion]) {
          newErrors[
            `course_${courseIndex}_${criterion}`
          ] = `${criterion} rating is required`;
        }
      });

      // Validate time slots and check for conflicts
      course.timeSlots?.forEach((slot, slotIndex) => {
        if (!slot.day) {
          newErrors[`course_${courseIndex}_slot_${slotIndex}_day`] =
            "Day is required";
        }
        if (!slot.timeslot) {
          newErrors[`course_${courseIndex}_slot_${slotIndex}_timeslot`] =
            "Time slot is required";
        }

        // Check for time slot conflicts
        if (slot.day && slot.timeslot) {
          const timeSlotKey = `${slot.day}-${slot.timeslot}`;
          const existingSlot = allTimeSlots.find(
            (existing) => existing.timeSlotKey === timeSlotKey
          );

          if (existingSlot) {
            newErrors[
              `course_${courseIndex}_slot_${slotIndex}_conflict`
            ] = `Time slot conflict with ${existingSlot.courseName} (${existingSlot.type})`;
            newErrors[
              `course_${existingSlot.courseIndex}_slot_${existingSlot.slotIndex}_conflict`
            ] = `Time slot conflict with ${course.courseName} (${slot.type})`;
          } else {
            allTimeSlots.push({
              timeSlotKey,
              courseIndex,
              slotIndex,
              courseName: course.courseName,
              type: slot.type,
            });
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
    if (errors[`course_${index}_${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`course_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const handleScoreChange = (courseIndex, criterion, value) => {
    const updatedCourses = [...courses];
    if (!updatedCourses[courseIndex].scores) {
      updatedCourses[courseIndex].scores = {};
    }
    updatedCourses[courseIndex].scores[criterion] = value;
    setCourses(updatedCourses);
    if (errors[`course_${courseIndex}_${criterion}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`course_${courseIndex}_${criterion}`];
        return newErrors;
      });
    }
  };

  const handleTimeSlotChange = (courseIndex, slotIndex, field, value) => {
    const updatedCourses = [...courses];
    if (!updatedCourses[courseIndex].timeSlots) {
      updatedCourses[courseIndex].timeSlots = [];
    }
    if (!updatedCourses[courseIndex].timeSlots[slotIndex]) {
      updatedCourses[courseIndex].timeSlots[slotIndex] = {};
    }
    updatedCourses[courseIndex].timeSlots[slotIndex][field] = value;
    setCourses(updatedCourses);
    if (
      errors[`course_${courseIndex}_slot_${slotIndex}_${field}`] ||
      errors[`course_${courseIndex}_slot_${slotIndex}_conflict`]
    ) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`course_${courseIndex}_slot_${slotIndex}_${field}`];
        delete newErrors[`course_${courseIndex}_slot_${slotIndex}_conflict`];
        return newErrors;
      });
    }
  };

  const addTimeSlot = (courseIndex) => {
    const updatedCourses = [...courses];
    if (!updatedCourses[courseIndex].timeSlots) {
      updatedCourses[courseIndex].timeSlots = [];
    }
    updatedCourses[courseIndex].timeSlots.push({
      day: "",
      timeslot: "",
      type: "Lecture",
    });
    setCourses(updatedCourses);
  };

  const removeTimeSlot = (courseIndex, slotIndex) => {
    const updatedCourses = [...courses];
    if (updatedCourses[courseIndex].timeSlots.length > 1) {
      updatedCourses[courseIndex].timeSlots.splice(slotIndex, 1);
      setCourses(updatedCourses);
    } else {
      alert("Each course must have at least one timeslot.");
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setUpdating(true);
        setSuccessMessage("");
        const userId = JSON.parse(localStorage.getItem("currentUser")).id;

        const response = await axios.post(
          "http://localhost:5100/schedule/update-collegeSchedule",
          {
            userId,
            courses: courses.map((course) => ({
              id: course.id,
              courseName: course.courseName,
              scores: course.scores,
              timeSlots: course.timeSlots,
            })),
          }
        );

        // Update local storage with new timetable and course IDs
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser) {
          currentUser.timetable = response.data.timetable;
          currentUser.courses = response.data.courseIds;
          currentUser["courses-sessions-mapping"] =
            response.data.courseSessionsMapping;
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        setSuccessMessage("Schedule updated successfully!");

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error updating schedule:", error);
        setErrors({
          submit:
            error.response?.data?.error ||
            "Failed to update schedule. Please try again.",
        });
      } finally {
        setUpdating(false);
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading courses...</div>;
  }

  return (
    <form
      onSubmit={handleUpdateSchedule}
      className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-md my-4 mx-2 sm:mx-auto"
    >
      <h2 className="text-2xl font-semibold mb-2 text-center">
        College Schedule
      </h2>
      <p className="text-gray-600 text-center text-sm mb-6">
        Manage your enrolled courses and their schedules
      </p>

      {courses.map((course, index) => (
        <div
          key={index}
          className="border border-gray-300 p-4 mt-4 rounded-lg shadow-md relative"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Course {index + 1}</h3>
            <button
              type="button"
              onClick={() => removeCourse(index)}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
            >
              Remove Course
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Course Name:</label>
              <input
                type="text"
                value={course.courseName || ""}
                onChange={(e) =>
                  handleCourseChange(index, "courseName", e.target.value)
                }
                className={`border p-2 w-full mt-1 rounded-lg ${
                  errors[`course_${index}_name`]
                    ? "border-red-500"
                    : "border-gray-300"
                } outline-none focus:border-indigo-500 transition-color duration-300`}
                placeholder="Enter Course Name"
              />
              {errors[`course_${index}_name`] && (
                <span className="text-red-500 text-sm">
                  {errors[`course_${index}_name`]}
                </span>
              )}
            </div>
          </div>

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
                      checked={course.scores?.[criterion] === score}
                      onChange={() =>
                        handleScoreChange(index, criterion, score)
                      }
                      className="hidden"
                    />
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer border transition ${
                        course.scores?.[criterion] === score
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
                <span className="text-red-500 text-sm">
                  {errors[`course_${index}_${criterion}`]}
                </span>
              )}
            </div>
          ))}

          <h4 className="font-semibold mt-3">Lecture & Section Timeslots</h4>
          {course.timeSlots?.map((slot, slotIndex) => (
            <div
              key={slotIndex}
              className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-center"
            >
              <div>
                <label className="block font-medium">Type:</label>
                <select
                  value={slot.type || "Lecture"}
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

              <div>
                <label className="block font-medium">Day:</label>
                <select
                  value={slot.day || ""}
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
                  <span className="text-red-500 text-sm">
                    {errors[`course_${index}_slot_${slotIndex}_day`]}
                  </span>
                )}
                {errors[`course_${index}_slot_${slotIndex}_conflict`] && (
                  <span className="text-red-500 text-sm">
                    {errors[`course_${index}_slot_${slotIndex}_conflict`]}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium">Timeslot:</label>
                <select
                  value={slot.timeslot || ""}
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
                  <span className="text-red-500 text-sm">
                    {errors[`course_${index}_slot_${slotIndex}_timeslot`]}
                  </span>
                )}
              </div>

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
          <button
            type="button"
            onClick={() => addTimeSlot(index)}
            className="text-indigo-500 font-medium mt-2 hover:underline"
          >
            + Add Time Slot
          </button>
        </div>
      ))}

      <div className="mt-4">
        <button
          type="button"
          onClick={addCourse}
          className="text-indigo-500 font-medium hover:underline"
        >
          + Add Another Course
        </button>
      </div>

      {errors.submit && (
        <div className="text-red-500 text-sm mt-2 text-center">
          {errors.submit}
        </div>
      )}

      {successMessage && (
        <div className="text-green-500 text-sm mt-2 text-center">
          {successMessage}
        </div>
      )}

      <div className="text-center mt-8">
        <button
          type="submit"
          disabled={updating}
          className={`w-full block text-white font-semibold px-3 py-2 rounded-md cursor-pointer transition duration-300 ${
            updating
              ? "bg-indigo-300 cursor-not-allowed"
              : "bg-indigo-400 hover:-translate-y-1"
          }`}
        >
          {updating ? "Updating..." : "Update Schedule"}
        </button>
      </div>
    </form>
  );
}

export default CollegeSchedule;
