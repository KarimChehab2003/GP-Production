import { useState } from "react";
import SlotModal from "./SlotModal";

function Timeslot({
  content,
  type,
  setTaskList,
  isCurrentDay,
  sessionCategory,
  modalEventType,
  modalSubject,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isDisabled = type !== "slot";

  const getClassNames = () => {
    let baseClasses =
      "flex justify-center items-center p-4 border border-indigo-200 ";

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
            baseClasses += "bg-teal-500/20 "; // Subtle green-blue
            break;
          case "lecture":
            baseClasses += "bg-blue-500/20 "; // Very light blue
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
            baseClasses += "bg-purple-500/20 "; // Light purple for sections
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
    if (type !== "slot") return;
    setIsModalOpen(true);
  };

  // Modify how content is displayed for different session categories
  const displayContent = () => {
    return content;
  };

  return (
    <div className={getClassNames()} onClick={handleClick}>
      <p className={"flex-grow " + (type === "day" ? "text-center" : "")}>
        {displayContent()}
      </p>

      {isModalOpen && (
        <SlotModal
          onClose={handleCloseModal}
          type={modalEventType}
          subject={modalSubject}
          setTaskList={setTaskList}
        />
      )}
    </div>
  );
}

export default Timeslot;
