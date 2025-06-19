import { useState } from "react";
import SlotModal from "./SlotModal";
import { useTasks } from "../contexts/TasksContext";
import { FaCheck, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

function getDateStringFromDayName(dayName, weekStart) {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const targetDayIndex = daysOfWeek.indexOf(dayName);
  if (targetDayIndex === -1) return "";
  const slotDate = new Date(weekStart);
  slotDate.setDate(weekStart.getDate() + targetDayIndex);
  return slotDate.toISOString().split("T")[0];
}

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
  dayNumber,
  weekStart,
  slotDate,
  completedTasks = [],
}) {
  // Debug: Log slot content and slotDate for every slot
  console.log("[SLOT DEBUG] content:", content, "slotDate:", slotDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { missedTasks } = useTasks();
  // Use slotDate directly for all date logic
  let slotDateString = slotDate;
  // Normalize slot subject/type for this slot
  let slotSubject = "";
  let slotType = "";
  if (content) {
    if (typeof content === "string" && content.startsWith("Study:")) {
      slotSubject = content
        .replace(/^Study:\s*/, "")
        .trim()
        .toLowerCase();
      slotType = "study";
    } else if (typeof content === "string" && content.startsWith("Lec:")) {
      slotSubject = content
        .replace(/^Lec:\s*/, "")
        .trim()
        .toLowerCase();
      slotType = "lecture";
    } else if (typeof content === "string" && content.startsWith("Sec:")) {
      slotSubject = content
        .replace(/^Sec:\s*/, "")
        .trim()
        .toLowerCase();
      slotType = "section";
    } else if (typeof content === "object" && content !== null) {
      if (content.subject && typeof content.subject === "string") {
        if (content.subject.startsWith("Study:")) {
          slotSubject = content.subject
            .replace(/^Study:\s*/, "")
            .trim()
            .toLowerCase();
          slotType = "study";
        } else if (content.subject.startsWith("Lec:")) {
          slotSubject = content.subject
            .replace(/^Lec:\s*/, "")
            .trim()
            .toLowerCase();
          slotType = "lecture";
        } else if (content.subject.startsWith("Sec:")) {
          slotSubject = content.subject
            .replace(/^Sec:\s*/, "")
            .trim()
            .toLowerCase();
          slotType = "section";
        } else {
          slotSubject = content.subject.trim().toLowerCase();
          slotType = "";
        }
      }
      if (content.date) {
        slotDateString = content.date;
      }
    }
  }

  // Check if this slot's content is completed
  const isCompleted = completedTasks.some((task) => {
    // Normalize completed task subject/type
    const taskSubject = (task.subject || "").trim().toLowerCase();
    const taskType = (task.type || "").trim().toLowerCase();

    // For study sessions, check if there's a completed study task
    if (slotType === "study") {
      const isStudyCompleted =
        taskType === "study" &&
        taskSubject === slotSubject &&
        task.day === slotDateString &&
        task.time === modalTime &&
        task.completed === true;
      return isStudyCompleted;
    }

    // For other types, check if there's a matching task
    return (
      taskType === slotType &&
      taskSubject === slotSubject &&
      task.day === slotDateString &&
      task.time === modalTime
    );
  });

  // Check if this slot is missed
  const isMissed = missedTasks.some((task) => {
    if (!content) return false;
    let subject = "";
    let typeCheck = "";
    if (typeof content === "string" && content.startsWith("Study:")) {
      subject = content.replace(/^Study:\s*/, "").trim();
      typeCheck = "study";
    } else if (typeof content === "string" && content.startsWith("Lec:")) {
      subject = content.replace(/^Lec:\s*/, "").trim();
      typeCheck = "lecture";
    } else if (typeof content === "string" && content.startsWith("Sec:")) {
      subject = content.replace(/^Sec:\s*/, "").trim();
      typeCheck = "section";
    }
    return (
      task.type === typeCheck &&
      task.subject === subject &&
      task.day === slotDateString &&
      task.time === modalTime
    );
  });

  const isDisabled = ignoreSlotRestrictions
    ? false
    : type !== "slot" ||
      !isCurrentDay ||
      sessionCategory === "break" ||
      sessionCategory === "empty" ||
      isCompleted ||
      isMissed;

  const getClassNames = () => {
    let baseClasses =
      "flex justify-center items-center p-4 border-1 border-indigo-200 relative ";

    // Type-specific classes
    switch (type) {
      case "day":
        // Base style for all day headers
        baseClasses +=
          "text-2xl font-semibold uppercase bg-gray-100 text-indigo-500 ";
        // Highlight for current day
        if (isCurrentDay) {
          baseClasses += "bg-indigo-400 border-indigo-500 text-white ";
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
    if (typeof content === "object" && content !== null) {
      return content.subject || "";
    }
    return content;
  };

  return (
    <div className={getClassNames()} onClick={handleClick}>
      {type === "day" && dayNumber ? (
        <p className="flex-grow text-center">
          {content}
          <span className="block text-sm font-normal text-gray-500">
            {dayNumber}
          </span>
        </p>
      ) : (
        <p className={"flex-grow " + (type === "day" ? "text-center" : "")}>
          {displayContent()}
        </p>
      )}
      {isCompleted &&
        type === "slot" &&
        (() => {
          console.log("[CHECKMARK RENDER] Rendering checkmark for slot", {
            slotSubject,
            slotType,
            slotDateString,
            modalTime,
          });
          return null;
        })()}
      {isCompleted && (type === "slot" || sessionCategory === "study") && (
        <div className="absolute top-1 right-1 bg-white rounded-full p-1">
          <FaCheck className="text-lg text-emerald-500" />
        </div>
      )}
      {isMissed && type === "slot" && (
        <div className="absolute top-1 right-1 bg-white rounded-full p-1">
          <FaTimesCircle className="text-lg text-red-500" title="Missed" />
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
          slotDate={slotDate}
          weekStart={weekStart}
        />
      )}
    </div>
  );
}

export default Timeslot;
