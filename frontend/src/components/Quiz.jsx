import { useState, useRef } from "react";
import axios from "axios";

function Quiz({ quiz, course, lectureNumber, sessionNumber }) {
  const [isVisible, setIsVisible] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlotsStructure = [
    "8AM-10AM",
    "10AM-12PM",
    "12PM-2PM",
    "2PM-4PM",
    "4PM-6PM",
    "6PM-8PM",
    "8PM-10PM",
  ];

  if (!quiz || !isVisible) return null;

  const handleChange = (type, idx, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [`${type}-${idx}`]: value,
    }));
  };

  // Helper to check if an answer is correct
  const isCorrect = (type, idx, correct, q = null) => {
    const user = userAnswers[`${type}-${idx}`];
    if (user == null || user === "") return false;

    if (type === "multipleChoice" && q) {
      // If correct is a key (A/B/C/D), compare directly
      if (["A", "B", "C", "D"].includes(correct)) {
        return user === correct;
      }
      // Otherwise, compare the selected option's text to the correct answer
      const selectedText = q.options[user]?.trim().toLowerCase();
      const correctText = correct?.trim().toLowerCase();
      return selectedText === correctText;
    }

    if (type === "fillInTheBlank") {
      if (typeof correct === "string") {
        const possibleAnswers = correct
          .split(",")
          .map((ans) => ans.trim().toLowerCase());
        return possibleAnswers.includes(user.trim().toLowerCase());
      }
    }

    if (
      (typeof correct === "string" &&
        user.trim().toLowerCase() === correct.trim().toLowerCase()) ||
      (typeof correct === "boolean" && user === correct)
    ) {
      return true;
    }
    return false;
  };

  const handleQuizCompletion = async (passed) => {
    setIsLoading(true);
    try {
      // Get current user data from localStorage
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        throw new Error("No user data found");
      }

      // Get all courses with the given name
      // Remove prefixes like "Study:", "Lec:", "Sec:", "Quiz session for " before sending to backend
      const cleanCourseName = course
        .replace(/^(Study:|Lec:|Sec:|Quiz session for )\s*/, "")
        .trim();

      const coursesResponse = await axios.get(
        `http://localhost:5100/api/courses?name=${encodeURIComponent(
          cleanCourseName
        )}`
      );
      const coursesData = coursesResponse.data;
      console.log("coursesData (from backend):", coursesData); // Debug log

      // Find the course whose ID is in the student's courses array
      const courseData = coursesData.find((c) =>
        currentUser.courses.includes(c.id)
      );

      console.log("currentUser.courses:", currentUser.courses); // Debug log
      console.log(
        "courseData found (after matching with user enrollment):",
        courseData
      ); // Debug log

      if (!courseData) {
        throw new Error("Not enrolled in this course");
      }

      const courseId = courseData.id;

      if (passed) {
        // Create learning objective
        const learningObjectiveResponse = await axios.post(
          "http://localhost:5100/api/quiz/learning-objective",
          {
            course: courseId,
            lecture_number: lectureNumber,
            session_number: sessionNumber,
          }
        );
        const learningObjectiveId = learningObjectiveResponse.data.id;

        // Create evaluation record
        const evaluationResponse = await axios.post(
          "http://localhost:5100/api/quiz/evaluation",
          {
            course: courseId,
            lecture_number: lectureNumber,
            session_number: sessionNumber,
            quiz: quiz,
          }
        );
        const evaluationId = evaluationResponse.data.id;

        // Create study session with both IDs
        await axios.post("http://localhost:5100/api/quiz/study-session", {
          course: courseId,
          session_sequence: [learningObjectiveId, evaluationId],
        });
      } else {
        // Schedule a retry session for the next day in an empty slot
        let scheduled = false;
        let updatedSchedule = { ...currentUser.timetable.schedule };

        // Helper to get day name from Date object
        const getDayName = (date) => daysOfWeek[date.getDay()];

        // Helper to parse time string for sorting
        const parseTime = (timeStr) => {
          const parts = timeStr.match(/(\d+)(AM|PM)-/);
          if (!parts) return 0;
          let hour = parseInt(parts[1]);
          const ampm = parts[2];
          if (ampm === "PM" && hour !== 12) hour += 12;
          if (ampm === "AM" && hour === 12) hour = 0;
          return hour;
        };

        const now = new Date();
        const todayIndex = now.getDay();
        const nextDayIndex = (todayIndex + 1) % 7; // Next day of the week
        const nextDayName = daysOfWeek[nextDayIndex];

        console.log(`Attempting to schedule on: ${nextDayName}`); // Debug log

        // Ensure the next day's schedule exists and is properly initialized with empty slots
        updatedSchedule[nextDayName] = updatedSchedule[nextDayName] || {};
        timeSlotsStructure.forEach((slot) => {
          if (updatedSchedule[nextDayName][slot] === undefined) {
            updatedSchedule[nextDayName][slot] = "";
          }
        });
        console.log(
          `Schedule for ${nextDayName} before search:`,
          updatedSchedule[nextDayName]
        ); // Debug log

        // Try to find an empty slot in the next day's schedule
        const daySchedule = updatedSchedule[nextDayName];
        const sortedTimeSlots = Object.entries(daySchedule).sort(
          (a, b) => parseTime(a[0]) - parseTime(b[0])
        );

        for (const [timeSlot, value] of sortedTimeSlots) {
          console.log(
            `  Checking slot ${timeSlot}: current value = '${value}'`
          ); // Debug log
          if (!value || value === "") {
            updatedSchedule[nextDayName][
              timeSlot
            ] = `Quiz session for ${course} on lecture ${lectureNumber}`;
            scheduled = true;
            console.log(`  Scheduled in ${nextDayName} ${timeSlot}`); // Debug log
            break;
          }
        }

        if (!scheduled) {
          // Fallback: If no slot found on the next day, search the rest of the week
          console.warn(
            `No empty slot found on ${nextDayName}. Searching rest of the week.`
          ); // Debug log
          let currentFallbackDayIndex = (nextDayIndex + 1) % 7; // Start search from day after next
          let attempts = 0;

          while (!scheduled && attempts < 6) {
            // Max 6 more days to check after nextDay
            const fallbackDayName = daysOfWeek[currentFallbackDayIndex];
            console.log(`  Checking fallback day: ${fallbackDayName}`); // Debug log
            updatedSchedule[fallbackDayName] =
              updatedSchedule[fallbackDayName] || {};
            timeSlotsStructure.forEach((slot) => {
              if (updatedSchedule[fallbackDayName][slot] === undefined) {
                updatedSchedule[fallbackDayName][slot] = "";
              }
            });

            const fallbackDaySchedule = updatedSchedule[fallbackDayName];
            const sortedFallbackTimeSlots = Object.entries(
              fallbackDaySchedule
            ).sort((a, b) => parseTime(a[0]) - parseTime(b[0]));

            for (const [timeSlot, value] of sortedFallbackTimeSlots) {
              console.log(
                `    Checking fallback slot ${timeSlot}: current value = '${value}'`
              ); // Debug log
              if (!value || value === "") {
                updatedSchedule[fallbackDayName][
                  timeSlot
                ] = `Quiz session for ${course} on lecture ${lectureNumber}`;
                scheduled = true;
                console.log(
                  `    Scheduled in fallback ${fallbackDayName} ${timeSlot}`
                ); // Debug log
                break;
              }
            }

            currentFallbackDayIndex = (currentFallbackDayIndex + 1) % 7;
            attempts++;
          }
        }

        if (!scheduled) {
          // Ultimate fallback: If all 2-hour slots across the entire week are full,
          // log a warning and place it on Monday 8AM-10AM (assuming this is a guaranteed slot).
          console.warn(
            "No free 2-hour slot found in the weekly schedule. Scheduling on Monday 8AM-10AM as a last resort."
          );
          updatedSchedule["Monday"] = updatedSchedule["Monday"] || {};
          updatedSchedule["Monday"][
            "8AM-10AM"
          ] = `Quiz session for ${course} on lecture ${lectureNumber}`;
          console.log("Scheduled as ultimate fallback on Monday 8AM-10AM."); // Debug log
        }

        console.log("Final updatedSchedule before saving:", updatedSchedule); // Debug log

        // Update user's timetable in localStorage
        const updatedTimetable = {
          ...currentUser.timetable,
          schedule: updatedSchedule,
        };
        const updatedUser = {
          ...currentUser,
          timetable: updatedTimetable,
        };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));

        // Update user data in Firebase
        await axios.post("http://localhost:5100/api/quiz/update-user", {
          userId: currentUser.id,
          timetable: updatedTimetable,
        });
      }
    } catch (error) {
      console.error("Error handling quiz completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    setShowResults(true);
    let total = 0;
    let correctCount = 0;

    // True/False
    quiz.trueFalse.forEach((q, i) => {
      total++;
      if (isCorrect("trueFalse", i, q.answer)) correctCount++;
    });

    // Multiple Choice
    quiz.multipleChoice.forEach((q, i) => {
      total++;
      const correct = q.answer?.replace(/[^A-D]/gi, "");
      if (isCorrect("multipleChoice", i, correct, q)) correctCount++;
    });

    // Fill in the Blank
    quiz.fillInTheBlank.forEach((q, i) => {
      total++;
      if (isCorrect("fillInTheBlank", i, q.answer)) correctCount++;
    });

    const finalScore = { correct: correctCount, total };
    setScore(finalScore);

    // Check if passed (more than 50%)
    const passed = correctCount / total > 0.5;
    handleQuizCompletion(passed);

    // Scroll to top of modal
    if (modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getFeedback = (type, idx, correct, q = null) => {
    if (!showResults) return null;
    const user = userAnswers[`${type}-${idx}`];
    if (user == null || user === "")
      return <span className="text-yellow-600 ml-2">No answer</span>;
    if (isCorrect(type, idx, correct, q)) {
      return <span className="text-green-600 ml-2 font-semibold">Correct</span>;
    }
    return <span className="text-red-600 ml-2 font-semibold">Incorrect</span>;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/10">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto border border-gray-200"
        style={{ maxHeight: "90vh" }}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={() => setIsVisible(false)}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="font-bold text-2xl mb-2 text-center text-indigo-700">
          Generated Quiz
        </h3>
        {score && (
          <div className="mb-4 text-xl font-bold text-center text-indigo-600 bg-indigo-50 rounded p-2 shadow">
            Your Score: {score.correct} / {score.total}
            {score.correct / score.total > 0.5 ? (
              <div className="text-green-600 mt-2">
                Congratulations! You passed!
              </div>
            ) : (
              <div className="text-red-600 mt-2">
                You need to retry. A quiz session has been scheduled for
                tomorrow.
              </div>
            )}
          </div>
        )}
        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Processing your results...</p>
          </div>
        )}
        <div className="space-y-8">
          {/* True/False */}
          {quiz.trueFalse.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                True/False Questions
              </h4>
              <ul className="space-y-4">
                {quiz.trueFalse.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <select
                      className="border rounded p-1"
                      value={userAnswers[`trueFalse-${i}`] || ""}
                      onChange={(e) =>
                        handleChange("trueFalse", i, e.target.value)
                      }
                    >
                      <option value="" hidden>
                        Select
                      </option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                    {getFeedback("trueFalse", i, q.answer)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Multiple Choice */}
          {quiz.multipleChoice.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                Multiple Choice Questions
              </h4>
              <ul className="space-y-4">
                {quiz.multipleChoice.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <ul>
                      {q.options &&
                        Object.entries(q.options).map(([key, value], idx) => (
                          <li key={key} className="mb-1">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`multipleChoice-${i}`}
                                value={key}
                                checked={
                                  userAnswers[`multipleChoice-${i}`] === key
                                }
                                onChange={() =>
                                  handleChange("multipleChoice", i, key)
                                }
                                className="mr-2"
                              />
                              {value}
                            </label>
                          </li>
                        ))}
                    </ul>
                    {getFeedback(
                      "multipleChoice",
                      i,
                      q.answer?.replace(/[^A-D]/gi, ""),
                      q
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fill in the Blank */}
          {quiz.fillInTheBlank.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                Fill in the Blank Questions
              </h4>
              <ul className="space-y-4">
                {quiz.fillInTheBlank.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <input
                      type="text"
                      className="border rounded p-1"
                      value={userAnswers[`fillInTheBlank-${i}`] || ""}
                      onChange={(e) =>
                        handleChange("fillInTheBlank", i, e.target.value)
                      }
                    />
                    {getFeedback("fillInTheBlank", i, q.answer)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          className="mt-8 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 font-bold text-lg shadow"
          onClick={checkAnswers}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Check Answers"}
        </button>
        {showResults && (
          <button
            className="mt-4 w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition duration-300 font-bold text-lg shadow"
            onClick={() => setIsVisible(false)}
            disabled={isLoading}
          >
            Close Quiz
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
