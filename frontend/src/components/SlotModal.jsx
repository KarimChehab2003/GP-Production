import { useState, useCallback } from "react";
import LectureSectionForm from "./LectureSectionForm";
import StudyForm from "./StudyForm";
import RetryQuizForm from "./RetryQuizForm";
import { useTasks } from "../contexts/TasksContext";

function SlotModal({
  onClose,
  type,
  subject,
  modalLectureNumber,
  modalDay,
  modalTime,
  onRemoveQuizSession,
}) {
  const { setTasks } = useTasks();
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
  const [formDetails, setFormDetails] = useState({
    subject: subject,
    type: eventType,
    day: modalDay,
    time: modalTime,
    timestamp: Date.now(),
  });

  const handleClick = () => {
    setTasks((prevTasks) => [...prevTasks, formDetails]);

    if (eventType === "lecture" || eventType === "section") {
      const {
        subject: completedSubject,
        number: lectureNumber,
        status,
      } = formDetails;

      let generatedTaskDescription = "";
      if (status === "fully") {
        const numOnly = lectureNumber
          ? lectureNumber.replace(eventType + " ", "")
          : "";
        generatedTaskDescription = `Study ${eventType} ${numOnly} from ${completedSubject} in the next study session`;
      } else if (status === "partially") {
        const numOnly = lectureNumber
          ? lectureNumber.replace(eventType + " ", "")
          : "";
        generatedTaskDescription = `Review ${eventType} ${numOnly} from ${completedSubject} in the next study session`;
      }

      if (generatedTaskDescription) {
        setTasks((prevTasks) => [
          ...prevTasks,
          {
            subject: generatedTaskDescription,
            type: "generated",
            originalEventType: eventType,
            originalSubject: completedSubject,
            originalLectureNumber: lectureNumber,
            originalStatus: status,
            timestamp: Date.now(),
          },
        ]);
      }
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
          />
        )}
        {eventType === "section" && (
          <LectureSectionForm
            eventType={eventType}
            subject={subject}
            setFormDetails={setFormDetails}
          />
        )}
        {eventType === "study" && (
          <StudyForm
            eventType={eventType}
            subject={subject}
            onCloseModal={memoizedOnClose}
            modalQuizLectureNumber={modalLectureNumber}
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
