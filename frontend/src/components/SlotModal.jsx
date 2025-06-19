import { useState, useCallback } from "react";
import LectureSectionForm from "./LectureSectionForm";
import StudyForm from "./StudyForm";
import RetryQuizForm from "./RetryQuizForm";
import { useTasks } from "../contexts/TasksContext";
import { getWeekKey } from "../contexts/TasksContext";
import axios from "axios";

function SlotModal({
  onClose,
  type,
  subject,
  modalLectureNumber,
  modalDay,
  modalTime,
  onRemoveQuizSession,
  slotDate,
  weekStart,
}) {
  const { setCompletedTasks, setGeneratedTasks, setCompletedTasksForWeek } =
    useTasks();
  const memoizedOnClose = useCallback(onClose, [onClose]);
  const eventType =
    type === "Lec"
      ? "lecture"
      : type === "Sec"
      ? "section"
      : type === "Study"
      ? "study"
      : type === "retryQuiz"
      ? "retryQuiz"
      : "";

  // Helper to fetch courseID for a subject
  const fetchCourseIdForSubject = async (subject) => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.courses) return null;
    try {
      const response = await axios.get(
        `http://localhost:5100/api/courses/filtered?name=${encodeURIComponent(
          subject
        )}&enrolledIds=${currentUser.courses.join(",")}`
      );
      return response.data.id;
    } catch (err) {
      return currentUser.courses[0] || null;
    }
  };

  const [formDetails, setFormDetails] = useState({
    subject: subject,
    type: eventType,
    day: slotDate,
    time: modalTime,
    timestamp: Date.now(),
    number: null,
    courseID: null,
  });

  const handleClick = async () => {
    // Fetch courseID for this subject
    const courseID = await fetchCourseIdForSubject(subject);
    const weekKey = getWeekKey(new Date(formDetails.day));
    const detailsWithCourse = { ...formDetails, courseID };
    setCompletedTasksForWeek(weekKey, (prev) => [...prev, detailsWithCourse]);
    if (eventType === "lecture" || eventType === "section") {
      const followUpTask = {
        type: "generated",
        subject: `Study ${formDetails.number || ""} in ${
          formDetails.subject
        } in your next study session`,
        day: formDetails.day,
        time: formDetails.time,
        timestamp: Date.now(),
        courseID,
      };
      setGeneratedTasks((prev) => [...prev, followUpTask]);
    }
    onClose();
  };

  return (
    <section className="min-h-screen flex justify-center items-center fixed top-0 left-0 w-full h-full z-50 cursor-auto bg-black/50">
      <div
        className="flex flex-col bg-white p-8 rounded-lg max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 transition duration-300 flex justify-center items-center text-xl text-white absolute -top-2 -right-2 shadow-lg"
          onClick={memoizedOnClose}
        >
          &times;
        </button>

        {eventType === "lecture" && (
          <LectureSectionForm
            eventType={eventType}
            subject={subject}
            setFormDetails={setFormDetails}
            weekStart={weekStart}
          />
        )}
        {eventType === "section" && (
          <LectureSectionForm
            eventType={eventType}
            subject={subject}
            setFormDetails={setFormDetails}
            weekStart={weekStart}
          />
        )}
        {eventType === "study" && (
          <StudyForm
            eventType={eventType}
            subject={subject}
            onCloseModal={memoizedOnClose}
            modalQuizLectureNumber={modalLectureNumber}
            modalDay={modalDay}
            modalTime={modalTime}
            slotDate={slotDate}
            weekStart={weekStart}
          />
        )}
        {eventType === "retryQuiz" && (
          <RetryQuizForm
            subject={subject}
            lectureNumber={modalLectureNumber}
            onCloseModal={memoizedOnClose}
            modalDay={modalDay}
            modalTime={modalTime}
            onRemoveQuizSession={onRemoveQuizSession}
          />
        )}

        {(eventType === "lecture" || eventType === "section") && (
          <button
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:-translate-y-1 transition duration-300 hover:cursor-pointer"
            onClick={handleClick}
          >
            Mark as done
          </button>
        )}
      </div>
    </section>
  );
}

export default SlotModal;
