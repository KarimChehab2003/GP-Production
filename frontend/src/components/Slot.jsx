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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { missedTasks } = useTasks();
  let slotDateString = slotDate;
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

  const isCompleted = completedTasks.some((task) => {
    const taskSubject = (task.subject || "").trim().toLowerCase();
    const taskType = (task.type || "").trim().toLowerCase();

    if (slotType === "study") {
      const isStudyCompleted =
        taskType === "study" &&
        taskSubject === slotSubject &&
        task.day === slotDateString &&
        task.time === modalTime &&
        task.completed === true;
      return isStudyCompleted;
    }

    return (
      taskType === slotType &&
      taskSubject === slotSubject &&
      task.day === slotDateString &&
      task.time === modalTime
    );
  });

  const isMissed = missedTasks.some((task) => {
    if (!content) return false;
    let subject = "";
    let typeCheck = "";
    let slotDateToCheck = slotDateString;
    if (typeof content === "string" && content.startsWith("Study:")) {
      subject = content
        .replace(/^Study:\s*/, "")
        .trim()
        .toLowerCase();
      typeCheck = "study";
    } else if (typeof content === "string" && content.startsWith("Lec:")) {
      subject = content
        .replace(/^Lec:\s*/, "")
        .trim()
        .toLowerCase();
      typeCheck = "lecture";
    } else if (typeof content === "string" && content.startsWith("Sec:")) {
      subject = content
        .replace(/^Sec:\s*/, "")
        .trim()
        .toLowerCase();
      typeCheck = "section";
    }
    if (typeof content === "object" && content.subject) {
      if (content.subject.startsWith("Study:")) {
        subject = content.subject
          .replace(/^Study:\s*/, "")
          .trim()
          .toLowerCase();
        typeCheck = "study";
      } else if (content.subject.startsWith("Lec:")) {
        subject = content.subject
          .replace(/^Lec:\s*/, "")
          .trim()
          .toLowerCase();
        typeCheck = "lecture";
      } else if (content.subject.startsWith("Sec:")) {
        subject = content.subject
          .replace(/^Sec:\s*/, "")
          .trim()
          .toLowerCase();
        typeCheck = "section";
      }
      if (content.date) {
        slotDateToCheck = content.date;
      }
    }
    return (
      (task.type || "").toLowerCase() === typeCheck &&
      (task.subject || "").trim().toLowerCase() === subject &&
      task.day === slotDateToCheck &&
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

    switch (type) {
      case "day":
        baseClasses +=
          "text-2xl font-semibold uppercase bg-gray-100 text-indigo-500 ";
        if (isCurrentDay) {
          baseClasses += "bg-indigo-400 border-indigo-500 text-white ";
        }
        break;
      case "timeslot":
        baseClasses += "text-lg text-gray-500 bg-gray-100 text-center ";
        break;
      case "slot":
        baseClasses += "text-base text-center text-black ";
        if (!isDisabled) {
          baseClasses +=
            "cursor-pointer hover:bg-gray-200 transition duration-300 ";
        }
        if (isCurrentDay) {
          baseClasses += "";
        }
        switch (sessionCategory) {
          case "study":
            baseClasses += "bg-teal-500/20 ";
            break;
          case "lecture":
            baseClasses += "bg-blue-500/20 ";
            break;
          case "break":
            baseClasses += "bg-gray-200 ";
            break;
          case "quizRetry":
            baseClasses += "bg-rose-500/20 ";
            break;
          case "empty":
            baseClasses += "bg-white ";
            break;
          case "section":
            baseClasses += "bg-purple-500/20 ";
            break;
          case "failedQuiz":
            baseClasses += "bg-red-500/20 ";
            break;
          case "rescheduled-lecture":
          case "rescheduled-section":
          case "rescheduled-study":
            baseClasses += "bg-yellow-400/30 ";
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

  const displayContent = () => {
    if (!content) return "";
    if (typeof content === "object" && content !== null) {
      let subject = content.subject || "";
      if (subject.includes("(Rescheduled)")) {
        subject = subject.replace(/\s*\(Rescheduled\)$/, "");
      }
      return subject;
    }
    if (typeof content === "string" && content.includes("(Rescheduled)")) {
      return content.replace(/\s*\(Rescheduled\)$/, "");
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
      {/* Show rescheduled indicator */}
      {type === "slot" &&
        content &&
        ((typeof content === "string" && content.includes("(Rescheduled)")) ||
          (typeof content === "object" &&
            content.subject &&
            content.subject.includes("(Rescheduled)"))) && (
          <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
            R
          </div>
        )}
      {isCompleted &&
        type === "slot" &&
        (() => {
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
