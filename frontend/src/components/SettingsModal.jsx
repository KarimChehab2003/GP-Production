import { useCallback } from "react";
import Conflicts from "./Conflicts";

function SettingsModal({
  onClose,
  type,
  externalActivities,
  collegeSchedule,
  conflicts,
}) {
  const memoizedOnClose = useCallback(onClose, [onClose]);

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

        {type === "conflicts" && (
          <Conflicts conflicts={conflicts} />
        )}
        {type === "collegeSchedule" && (
          <h1>college schedule</h1>
        )}
        {type === "externalActivities" && (
          <h1>external activities</h1>
        )}

      </div>
    </section>
  );
}

export default SettingsModal;
