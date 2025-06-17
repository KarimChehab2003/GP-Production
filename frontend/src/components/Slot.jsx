import { useState } from "react";
import SlotModal from "./SlotModal";
import { useTasks } from "../contexts/TasksContext";
import { FaCheck, FaCheckCircle } from "react-icons/fa";

function Timeslot({
  content,
  type,
  isCurrentDay,
  sessionCategory,
  modalEventType,
  modalSubject,
  modalLectureNumber,
  modalDay,
  modalTime,
  onRemoveQuizSession,
  ignoreSlotRestrictions = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { completedTasks } = useTasks();
  // Check if this slot's content is completed
  const isCompleted = completedTasks.some((task) => {
    if (!content) return false;

    // Extract subject from content
    let subject = "";
    if (content.startsWith("Study:")) {
      subject = content.replace(/^Study:\s*/, "").trim();
    } else if (content.startsWith("Lec:")) {
      subject = content.replace(/^Lec:\s*/, "").trim();
    } else if (content.startsWith("Sec:")) {
      subject = content.replace(/^Sec:\s*/, "").trim();
    }

    // For study sessions, check if there's a completed study task
    if (content.startsWith("Study:")) {
      const isStudyCompleted =
        task.type === "study" &&
        task.subject === subject &&
        task.day === modalDay &&
        task.time === modalTime &&
        task.completed === true;
      return isStudyCompleted;
    }

    // For other types, check if there's a matching task
    return (
      task.subject === subject &&
      task.day === modalDay &&
      task.time === modalTime
    );
  });

  const isDisabled = ignoreSlotRestrictions
    ? false
    : type !== "slot" ||
      !isCurrentDay ||
      sessionCategory === "break" ||
      sessionCategory === "empty" ||
      isCompleted;

  const getClassNames = () => {
    let baseClasses =
      "flex justify-center items-center p-4 border-1 border-indigo-200 relative ";

    // Type-specific classes
    switch (type) {
      case "day":
        baseClasses += "text-2xl text-indigo-500 font-semibold uppercase ";
        if (isCurrentDay) {
          baseClasses += "bg-indigo-400 border-indigo-500 text-white "; // Stronger highlight for current day
        }
        break;
      case "timeslot":
        baseClasses += "text-lg text-gray-500 bg-gray-100 text-center "; // Background for time slot headers
        break;
      case "slot":
        baseClasses += "text-base text-center text-black ";
        if (!isDisabled) {
          baseClasses +=
            "cursor-pointer hover:bg-gray-200 transition duration-300 ";
        }
        if (isCurrentDay) {
          baseClasses += ""; // Subtle highlight for current day slots
        }
        // Session category specific colors
        switch (sessionCategory) {
          case "study":
            baseClasses += "bg-teal-500/20 "; // Darker green for completed
            break;
          case "lecture":
            baseClasses += "bg-blue-500/20 "; // Darker blue for completed
            break;
          case "break":
            baseClasses += "bg-gray-200 "; // Slightly darker gray for breaks
            break;
          case "quizRetry":
            baseClasses += "bg-rose-500/20 "; // Very light red for quiz retries
            break;
          case "empty":
            baseClasses += "bg-white "; // Default empty slot
            break;
          case "section":
            baseClasses += "bg-purple-500/20 "; // Darker purple for completed
            break;
          case "failedQuiz":
            baseClasses += "bg-red-500/20 "; // Solid red for failed quizzes
            break;
          default:
            break;
        }
        break;
      case "default":
      default:
        break;
    }

    return baseClasses;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleClick = () => {
    if (isDisabled) return;
    setIsModalOpen(true);
  };

  // Modify how content is displayed for different session categories
  const displayContent = () => {
    if (!content) return "";
    return content;
  };

  return (
    <div className={getClassNames()} onClick={handleClick}>
      <p className={"flex-grow " + (type === "day" ? "text-center" : "")}>
        {displayContent()}
      </p>
      {isCompleted && type === "slot" && (
        <div className="absolute top-1 right-1 bg-white rounded-full p-1">
          <FaCheck className="text-lg text-emerald-500" />
        </div>
      )}
      {isModalOpen && (
        <SlotModal
          onClose={handleCloseModal}
          type={modalEventType}
          subject={modalSubject}
          modalLectureNumber={modalLectureNumber}
          modalDay={modalDay}
          modalTime={modalTime}
          onRemoveQuizSession={onRemoveQuizSession}
        />
      )}
    </div>
  );
}

export default Timeslot;
