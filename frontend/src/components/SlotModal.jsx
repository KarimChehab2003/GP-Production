import LectureSectionForm from "./LectureSectionForm";
import StudyForm from "./StudyForm";

function SlotModal({ onClose, type, subject }) {

    const eventType = type === "Lec" ? "lecture" : type === "Sec" ? "section" : type === "Study" ? "study" : "";
    return (
        <section className="min-h-screen flex justify-center items-center fixed top-0 left-0 w-full h-full bg-black/50 z-50 cursor-auto">
            <div className="flex flex-col bg-white p-8 rounded-lg max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                <button
                    className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 transition duration-300 flex justify-center items-center text-xl text-white absolute -top-2 -right-2 shadow-lg"
                    onClick={onClose}
                >
                    &times;
                </button>

                {eventType === "lecture" && (
                    <LectureSectionForm eventType={eventType} subject={subject} />
                )}
                {eventType === "section" && (
                    <LectureSectionForm eventType={eventType} subject={subject} />
                )}
                {eventType === "study" && (
                    <StudyForm />
                )}

                <button className="mt-4 px-6 py-2 bg-indigo-400 text-white rounded-lg shadow-md hover:-translate-y-1 transition duration-300 hover:cursor-pointer">
                    Mark as done
                </button>
            </div>
        </section>
    );
}

export default SlotModal;
