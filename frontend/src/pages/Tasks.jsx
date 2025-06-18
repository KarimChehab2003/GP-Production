import { useEffect, useState } from "react";
import { useTasks } from "../contexts/TasksContext";

function Tasks() {
  const { generatedTasks, completedTasks, missedTasks } = useTasks();
  console.log("generatedTasks:", generatedTasks);
  console.log("completedTasks:", completedTasks);
  console.log("missedTasks:", missedTasks);
  const [currentDayStudySessions, setCurrentDayStudySessions] = useState([]);

  useEffect(() => {
    // Get current day's study sessions
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const collegeSchedule = currentUser?.timetable?.schedule;

    if (collegeSchedule) {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const currentDayName = days[new Date().getDay()];

      const todaySchedule = collegeSchedule[currentDayName] || {};
      const studySessionsToday = [];

      for (const timeSlot in todaySchedule) {
        const content = todaySchedule[timeSlot];
        if (content.startsWith("Study:")) {
          const subject = content.replace(/^Study:\s*/, "").trim();
          studySessionsToday.push({ time: timeSlot, subject: subject });
        }
      }
      setCurrentDayStudySessions(studySessionsToday);
    }
  }, []);

  return (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Tasks</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Follow-up Tasks</h3>
        {generatedTasks.length === 0 ? (
          <p className="text-gray-600">No follow-up tasks generated yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {generatedTasks.map((task, idx) => (
              <article
                key={idx}
                className="p-4 border rounded-md shadow-sm bg-blue-50"
              >
                <p className="font-medium text-lg">{task.subject}</p>
                {/* You can add more details from the task object if needed */}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">
          Today's Study Sessions (
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          )
        </h3>
        {currentDayStudySessions.length === 0 ? (
          <p className="text-gray-600">
            No study sessions scheduled for today.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentDayStudySessions.map((session, idx) => (
              <article
                key={idx}
                className="p-4 border rounded-md shadow-sm bg-green-50"
              >
                <p className="font-medium text-lg">
                  {session.time}: {session.subject}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Missed Tasks</h3>
        {missedTasks.length === 0 ? (
          <p className="text-gray-600">No missed tasks! 🎉</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {missedTasks.map((task, idx) => (
              <article
                key={idx}
                className="p-4 border rounded-md shadow-sm bg-rose-100"
              >
                <p className="font-medium text-lg">{task.subject}</p>
                <p className="text-sm text-gray-500">Day: {task.day}</p>
                <p className="text-sm text-gray-500">Time: {task.time}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Tasks;
