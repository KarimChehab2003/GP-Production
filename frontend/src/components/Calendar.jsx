import Slot from "./Slot";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTasks } from "../contexts/TasksContext";
import { getWeekKey } from "../contexts/TasksContext";

// Helper to get the start of the current week (Sunday)
function getCurrentWeekStart() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Helper to get the date string for a given day index in the week (0=Sunday, 1=Monday, ...)
function getDateStringForWeekday(weekStart, dayIndex) {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayIndex);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Calendar({ setTaskList, ignoreSlotRestrictions = false }) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeslots = [
    "8AM-10AM",
    "10AM-12PM",
    "12PM-2PM",
    "2PM-4PM",
    "4PM-6PM",
    "6PM-8PM",
    "8PM-10PM",
  ];

  const [calendarData, setCalendarData] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart());
  const {
    checkForMissedTasksEndOfDay,
    getCompletedTasksForWeek,
    isTasksLoaded,
    isCalendarReady,
    setIsCalendarReady,
    triggerMissedTasksCheckup,
  } = useTasks();
  const weekKey = getWeekKey(weekStart);
  const completedTasks = getCompletedTasksForWeek(weekKey);

  // Signal that calendar is ready and trigger missed tasks checkup
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser && currentUser.id) {
      console.log("[CALENDAR] Calendar component mounted, signaling ready...");
      setIsCalendarReady(true);

      // Trigger missed tasks checkup if not already loaded
      if (!isTasksLoaded) {
        console.log("[CALENDAR] Tasks not loaded, triggering checkup...");
        triggerMissedTasksCheckup().catch((err) => {
          console.error(
            "[CALENDAR] Error triggering missed tasks checkup:",
            err
          );
        });
      }
    }

    // Cleanup function to reset ready state when component unmounts
    return () => {
      console.log(
        "[CALENDAR] Calendar component unmounting, resetting ready state..."
      );
      setIsCalendarReady(false);
    };
  }, [setIsCalendarReady, isTasksLoaded, triggerMissedTasksCheckup]);

  // Function to create the calendar data
  const createCalendar = () => {
    const initialCalendar = Array.from({ length: 8 }, () =>
      new Array(8).fill("")
    );
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (i === 0 && j === 0) continue;
        if (i === 0) initialCalendar[i][j] = days[j - 1];
        if (j === 0) initialCalendar[i][j] = timeslots[i - 1];
      }
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const collegeSchedule = currentUser?.timetable?.schedule;
    // Use the weekStart from state
    if (collegeSchedule) {
      Object.entries(collegeSchedule).forEach(([day, schedule]) => {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return;
        const dateString = getDateStringForWeekday(weekStart, dayIndex);
        Object.entries(schedule).forEach(([time, subject]) => {
          const timeIndex = timeslots.indexOf(time);
          if (timeIndex !== -1) {
            // Store both subject and the anchored date string for this slot
            initialCalendar[timeIndex + 1][dayIndex + 1] = {
              subject,
              date: dateString,
            };
          }
        });
      });
    }
    // Ensure every slot has a date property, even if empty
    for (let i = 1; i < 8; i++) {
      for (let j = 1; j < 8; j++) {
        const dateString = getDateStringForWeekday(weekStart, j - 1);
        if (
          !initialCalendar[i][j] ||
          typeof initialCalendar[i][j] === "string"
        ) {
          initialCalendar[i][j] = {
            subject: initialCalendar[i][j] || "",
            date: dateString,
          };
        }
      }
    }
    // After filling from collegeSchedule, also fill in completed study sessions if not already present
    completedTasks.forEach((task) => {
      if (task.type === "study" && task.completed && task.day && task.time) {
        const dayIndex = days.findIndex(
          (d) =>
            getDateStringForWeekday(weekStart, days.indexOf(d)) === task.day
        );
        const timeIndex = timeslots.indexOf(task.time);
        if (dayIndex !== -1 && timeIndex !== -1) {
          // Only fill if slot is empty
          const slot = initialCalendar[timeIndex + 1][dayIndex + 1];
          if (!slot || !slot.subject) {
            initialCalendar[timeIndex + 1][dayIndex + 1] = {
              subject: `Study: ${task.subject}`,
              date: task.day,
            };
          }
        }
      }
    });
    return initialCalendar;
  };

  // Effect to update calendar data when weekStart or setTaskList changes
  useEffect(() => {
    setCalendarData(createCalendar());
  }, [weekStart, setTaskList]);

  // Week navigation handlers
  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    });
  };
  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    });
  };

  const handleRemoveQuizSession = useCallback(
    async (day, time, subject, lectureNumber) => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (
          !currentUser ||
          !currentUser.timetable ||
          !currentUser.timetable.schedule
        ) {
          console.error("Current user or timetable not found.");
          return;
        }

        const updatedSchedule = { ...currentUser.timetable.schedule };
        if (updatedSchedule[day] && updatedSchedule[day][time]) {
          updatedSchedule[day][time] = ""; // Remove the session from the schedule
        }

        // Update local storage
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            timetable: { schedule: updatedSchedule },
          })
        );

        // Update database
        await axios.put("http://localhost:5100/api/quiz/update-user", {
          userId: currentUser.id,
          timetable: { schedule: updatedSchedule },
        });

        // Update calendar data to reflect removal
        setCalendarData(createCalendar());
        alert(
          `Quiz session for ${subject} on lecture ${lectureNumber} removed successfully!`
        );
      } catch (error) {
        console.error("Error removing quiz session:", error);
        alert("Failed to remove quiz session.");
      }
    },
    []
  );

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={goToPrevWeek}
          className="px-3 py-1 bg-indigo-200 rounded hover:bg-indigo-300"
        >
          Previous Week
        </button>
        <span className="font-semibold text-lg">
          Week of{" "}
          {weekStart.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        <button
          onClick={goToNextWeek}
          className="px-3 py-1 bg-indigo-200 rounded hover:bg-indigo-300"
        >
          Next Week
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1 h-full">
        {calendarData.map((row, i) =>
          row.map((col, j) => {
            const slotType = i === 0 ? "day" : j === 0 ? "timeslot" : "slot";
            const isCurrentDay = days[j - 1] === days[new Date().getDay()];
            let sessionCategory = "empty";
            let modalEventType = "";
            let modalSubject = "";
            let modalLectureNumber = null;
            let modalDay = days[j - 1];
            let modalTime = timeslots[i - 1];

            // For header row, show day name and date number
            if (i === 0 && j > 0) {
              const date = new Date(weekStart);
              date.setDate(weekStart.getDate() + (j - 1));
              const dayNum = date.getDate();
              const slotDate = date.toISOString().split("T")[0];
              return (
                <Slot
                  key={`header-${j}`}
                  content={days[j - 1]}
                  type="day"
                  isCurrentDay={days[j - 1] === days[new Date().getDay()]}
                  dayNumber={`${dayNum}${getDaySuffix(dayNum)}`}
                  weekStart={weekStart}
                  slotDate={slotDate}
                />
              );
            }

            if (col) {
              let content = col;
              if (typeof col === "object" && col !== null) {
                content = col.subject;
              }
              if (typeof content === "string" && content.startsWith("Study:")) {
                // Check if it's a rescheduled study session
                if (content.includes("(Rescheduled)")) {
                  sessionCategory = "rescheduled-study";
                  modalEventType = "Study";
                  modalSubject = content
                    .replace(/^Study:\s*/, "")
                    .replace(/\s*\(Rescheduled\)$/, "")
                    .trim();
                } else {
                  sessionCategory = "study";
                  modalEventType = "Study";
                  modalSubject = content.replace(/^Study:\s*/, "").trim();
                }
              } else if (
                typeof content === "string" &&
                content.startsWith("Lec:")
              ) {
                sessionCategory = "lecture";
                modalEventType = "Lec";
                modalSubject = content.replace(/^Lec:\s*/, "").trim();
              } else if (
                typeof content === "string" &&
                content.startsWith("Sec:")
              ) {
                sessionCategory = "section";
                modalEventType = "Sec";
                modalSubject = content.replace(/^Sec:\s*/, "").trim();
              } else if (content === "Break") {
                sessionCategory = "break";
                modalEventType = "";
              } else if (
                typeof content === "string" &&
                content.startsWith("Quiz session for")
              ) {
                sessionCategory = "failedQuiz";
                modalEventType = "retryQuiz";
                const match = content.match(
                  /Quiz session for (.+) on lecture (\d+)/
                );
                if (match) {
                  modalSubject = match[1];
                  modalLectureNumber = parseInt(match[2]);
                }
              } else {
                sessionCategory = "empty";
                modalEventType = "";
              }
            }

            return (
              <Slot
                key={`${i}-${j}`}
                content={col}
                type={slotType}
                isCurrentDay={isCurrentDay}
                sessionCategory={sessionCategory}
                setTaskList={setTaskList}
                modalEventType={modalEventType}
                modalSubject={modalSubject}
                modalLectureNumber={modalLectureNumber}
                modalDay={modalDay}
                modalTime={modalTime}
                onRemoveQuizSession={handleRemoveQuizSession}
                ignoreSlotRestrictions={ignoreSlotRestrictions}
                weekStart={weekStart}
                slotDate={col.date}
                completedTasks={completedTasks}
              />
            );
          })
        )}
      </div>
    </>
  );
}

// Helper to get ordinal suffix for a day number
function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export default Calendar;
