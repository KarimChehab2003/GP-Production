import { useCallback } from "react";
import Conflicts from "./Conflicts";
import ExternalActivities from "./ExternalActivities";
import CollegeSchedule from "./CollegeSchedule";
import Profile from "./Profile";

function SettingsModal({
  onClose,
  type,
  externalActivities,
  takesExternalActivities,
  enrolledCourses,
  conflicts,
}) {
  const memoizedOnClose = useCallback(onClose, [onClose]);

  return (
    <section className="min-h-screen flex justify-center items-center fixed top-0 left-0 w-full h-full z-50 cursor-auto bg-black/50 overflow-y-auto py-8">
      <div
        className="flex flex-col bg-white rounded-lg max-w-lg relative my-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 transition duration-300 flex justify-center items-center text-xl text-white absolute -top-2 -right-2 shadow-lg z-10"
          onClick={memoizedOnClose}
        >
          &times;
        </button>

        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
          {type === "profile" && (
            <Profile/>
          )}
          {type === "conflicts" && (
            <Conflicts conflicts={conflicts} />
          )}
          {type === "collegeSchedule" && (
            <CollegeSchedule enrolledCourses={enrolledCourses} />
          )}
          {type === "externalActivities" && (
            <ExternalActivities 
              externalActivities={externalActivities} 
              takesExternalActivities={takesExternalActivities} 
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default SettingsModal;
