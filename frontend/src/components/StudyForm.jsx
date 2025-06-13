import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LectureForm from "./LectureForm"; // Import LectureForm from its new file
import React from "react";

function StudyForm({ eventType, subject, onCloseModal }) {
  const [lectureCount, setLectureCount] = useState(1);
  const [lectureDetails, setLectureDetails] = useState([]);
  const [error, setError] = useState(null);
  const [currentSessionNumber, setCurrentSessionNumber] = useState(1);
  const [courseId, setCourseId] = useState(null);
  const [completedQuizzesResults, setCompletedQuizzesResults] = useState([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!subject) return;
      const cleanedSubject = subject.replace(/^Study:\s*/, "").trim();
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      if (
        !currentUser ||
        !currentUser.courses ||
        currentUser.courses.length === 0
      ) {
        setError("No enrolled courses found for the current user.");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5100/api/courses?name=${encodeURIComponent(
            cleanedSubject
          )}`
        );
        const allCoursesWithName = response.data;

        const courseData = allCoursesWithName.find((course) =>
          currentUser.courses.includes(course.id)
        );

        if (courseData) {
          setCourseId(courseData.id);
          setCurrentSessionNumber((courseData.completedSessions || 0) + 1);
        } else {
          setError(
            "Course not found for the current user in enrolled courses."
          );
        }
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError("Failed to load course information.");
      }
    };
    fetchCourseData();
  }, [subject]);

  const handleLectureChange = useCallback((index, field, value) => {
    setLectureDetails((prevDetails) => {
      const updatedDetails = [...prevDetails];
      if (!updatedDetails[index]) {
        updatedDetails[index] = {};
      }
      const currentLectureValue = updatedDetails[index][field];

      if (currentLectureValue !== value) {
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value,
        };
        return updatedDetails;
      }
      return prevDetails; // Return previous state if no change to prevent re-render
    });
  }, []);

  // handleFileUpload and generatedQuiz state are moved to LectureForm

  const learningSequence = lectureDetails
    .map((detail) => parseInt(detail.number))
    .filter((num) => !isNaN(num));

  const handleQuizCompleted = useCallback(
    (passed, quizData, userAnswers, calculatedScore, lectureNumberForQuiz) => {
      setCompletedQuizzesResults((prevResults) => [
        ...prevResults,
        {
          passed,
          quizData,
          userAnswers,
          calculatedScore,
          lectureNumber: lectureNumberForQuiz,
        },
      ]);
    },
    [setCompletedQuizzesResults]
  );

  const handleFinalStudySessionSubmission = async () => {
    setError(null);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        throw new Error("No user data found");
      }
      if (!courseId) {
        throw new Error("Course ID not found. Cannot submit study session.");
      }

      const learningObjectiveIds = [];
      const evaluationIds = [];
      let updatedSchedule = { ...currentUser.timetable.schedule };

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
      const getDayName = (date) => daysOfWeek[date.getDay()];
      const parseTime = (timeStr) => {
        const parts = timeStr.match(/(\d+)(AM|PM)-/);
        if (!parts) return 0;
        let hour = parseInt(parts[1]);
        const ampm = parts[2];
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        return hour;
      };

      for (const quizResult of completedQuizzesResults) {
        const { passed, quizData, lectureNumber } = quizResult;

        if (passed) {
          console.log(
            `Quiz for lecture ${lectureNumber} passed. Creating LO, Eval, Study Session.`
          );
          const loResponse = await axios.post(
            "http://localhost:5100/api/quiz/learning-objective",
            {
              course: courseId,
              lecture_number: lectureNumber,
              session_number: currentSessionNumber,
            }
          );
          learningObjectiveIds.push(loResponse.data.id);

          const evalResponse = await axios.post(
            "http://localhost:5100/api/quiz/evaluation",
            {
              course: courseId,
              lecture_number: lectureNumber,
              session_number: currentSessionNumber,
              quiz: quizData,
            }
          );
          evaluationIds.push(evalResponse.data.id);
        } else {
          console.log(
            `Quiz for lecture ${lectureNumber} failed. Scheduling temporary session.`
          );
          const currentDate = new Date();
          const currentDayName = getDayName(currentDate);

          // Find a slot today or tomorrow
          let sessionScheduled = false;
          for (let i = 0; i < 2; i++) {
            // 0 for today, 1 for tomorrow
            const targetDate = new Date(currentDate);
            targetDate.setDate(currentDate.getDate() + i);
            const targetDayName = getDayName(targetDate);

            if (updatedSchedule[targetDayName]) {
              // Sort time slots to find the earliest available
              const sortedTimeSlots = [...timeSlotsStructure].sort((a, b) => {
                return parseTime(a) - parseTime(b);
              });

              for (const slot of sortedTimeSlots) {
                if (updatedSchedule[targetDayName][slot] === "") {
                  const sessionName = `Quiz session for ${subject
                    .replace(/^Study:\s*/, "")
                    .trim()} on lecture ${lectureNumber}`;
                  updatedSchedule[targetDayName][slot] = sessionName;
                  sessionScheduled = true;
                  break;
                }
              }
            }
            if (sessionScheduled) break;
          }

          if (!sessionScheduled) {
            console.warn("Could not find an empty slot in the next 24 hours.");
            // Fallback: Schedule for Monday 8AM-10AM if all else fails
            const fallbackDay = "Monday";
            const fallbackSlot = "8AM-10AM";
            if (!updatedSchedule[fallbackDay]) {
              updatedSchedule[fallbackDay] = {};
            }
            if (updatedSchedule[fallbackDay][fallbackSlot] === "") {
              const sessionName = `Quiz session for ${subject
                .replace(/^Study:\s*/, "")
                .trim()} on lecture ${lectureNumber}`;
              updatedSchedule[fallbackDay][fallbackSlot] = sessionName;
            }
          }
        }
      }

      const sessionSequence = [...learningObjectiveIds, ...evaluationIds];

      // Create the final Study Session document
      await axios.post("http://localhost:5100/api/quiz/study-session", {
        course: courseId,
        session_sequence: sessionSequence,
        learning_sequence: learningSequence,
      });

      // Update user timetable in Firebase if any changes were made due to failed quizzes
      if (completedQuizzesResults.some((result) => !result.passed)) {
        await axios.put("http://localhost:5100/api/quiz/update-user", {
          userId: currentUser.id,
          timetable: { schedule: updatedSchedule },
        });
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            timetable: { schedule: updatedSchedule },
          })
        );
      }

      alert("Study session submitted successfully!");
      onCloseModal(); // Close modal on successful submission
    } catch (err) {
      console.error("Error submitting study session:", err);
      setError(err.response?.data?.error || "Failed to submit study session.");
    }
  };

  return (
    <div className="flex flex-col p-4 space-y-4 overflow-y-auto max-h-[80vh]">
      <h2 className="text-2xl font-semibold mb-3">
        STUDY SESSION #{currentSessionNumber}
      </h2>

      {[...Array(lectureCount)].map((_, index) => (
        <LectureForm
          key={index}
          index={index}
          lectureNumber={lectureDetails[index]?.number}
          onLectureChange={handleLectureChange}
          sessionNumber={currentSessionNumber}
          onQuizCompleted={handleQuizCompleted}
        />
      ))}

      <div className="flex justify-between mt-6">
        <button
          onClick={() => setLectureCount(lectureCount + 1)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          Add Lecture
        </button>
        <button
          onClick={() => setLectureCount(Math.max(1, lectureCount - 1))}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
          Remove Last Lecture
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {completedQuizzesResults.length > 0 && (
        <button
          onClick={handleFinalStudySessionSubmission}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:-translate-y-1 transition duration-300 hover:cursor-pointer"
        >
          Mark Study Session as Done
        </button>
      )}
    </div>
  );
}

export default StudyForm;
