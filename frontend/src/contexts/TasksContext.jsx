import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  // Store all weeks' data in an object
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [lastCheckedDate, setLastCheckedDate] = useState(null);

  // Get userId from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const userId = currentUser?.id;

  // Get current week key
  const currentWeekKey = getWeekKey();

  // Get current week's arrays (default to empty)
  const completedTasks = weeklyTasks[currentWeekKey]?.completedTasks || [];
  const missedTasks = weeklyTasks[currentWeekKey]?.missedTasks || [];
  const generatedTasks = weeklyTasks[currentWeekKey]?.generatedTasks || [];

  // Helper to update a specific week's arrays
  function updateWeekTasks(updates) {
    setWeeklyTasks((prev) => ({
      ...prev,
      [currentWeekKey]: {
        completedTasks:
          updates.completedTasks ?? prev[currentWeekKey]?.completedTasks ?? [],
        missedTasks:
          updates.missedTasks ?? prev[currentWeekKey]?.missedTasks ?? [],
        generatedTasks:
          updates.generatedTasks ?? prev[currentWeekKey]?.generatedTasks ?? [],
      },
    }));
  }

  // Helper to get today's date string (YYYY-MM-DD) in local time
  const getDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to get current time as a Date object (today)
  const getCurrentTimeAsDate = () => {
    const now = new Date();
    return now;
  };

  // Helper to parse end time from slot string (e.g., '10AM-12PM' => Date object today at 12:00)
  const parseSlotEndTime = (slotRange, currentDate = new Date()) => {
    if (!slotRange) return null;
    const end = slotRange.split("-")[1]; // e.g., '12PM'
    if (!end) return null;
    const match = end.match(/(\d+)(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const ampm = match[2].toUpperCase();
    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;
    const endDate = new Date(currentDate);
    endDate.setHours(hour, 0, 0, 0);
    return endDate;
  };

  // Helper to get today's scheduled lectures/sections from timetable
  const getTodaysScheduledLecturesSections = () => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const schedule = currentUser?.timetable?.schedule;
    if (!schedule) return [];
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = daysOfWeek[new Date().getDay()];
    const todaySchedule = schedule[todayName] || {};
    const result = [];
    for (const time in todaySchedule) {
      const content = todaySchedule[time];
      if (content.startsWith("Lec:")) {
        result.push({
          type: "lecture",
          subject: content.replace(/^Lec:\s*/, "").trim(),
          day: getDateString(),
          time,
        });
      } else if (content.startsWith("Sec:")) {
        result.push({
          type: "section",
          subject: content.replace(/^Sec:\s*/, "").trim(),
          day: getDateString(),
          time,
        });
      }
    }
    return result;
  };

  // Refactor checkForMissedTasksEndOfDay to accept a date parameter (defaults to today)
  const checkForMissedTasksEndOfDay = (dateOverride) => {
    console.log("[MissedTaskCheck] Running at", new Date().toLocaleString());
    if (!isTasksLoaded || !userId) return;
    const dateToCheck = dateOverride || getDateString();
    const now = getCurrentTimeAsDate();

    // 1. Check lectures/sections
    const scheduled = getTodaysScheduledLecturesSections();
    // DEBUG LOG
    console.log(
      "[MissedTaskCheck] Scheduled slots for",
      dateToCheck,
      scheduled
    );
    console.log("[MissedTaskCheck] Completed tasks:", completedTasks);
    const missedLectSec = scheduled.filter((slot) => {
      // Use dateToCheck for the day
      const found = completedTasks.some(
        (ct) =>
          ct.type === slot.type &&
          ct.subject === slot.subject &&
          ct.day === dateToCheck &&
          ct.time === slot.time
      );
      if (!found) {
        console.log("[MissedTaskCheck][NO MATCH]", { slot, completedTasks });
      }
      // Only count if the slot is for dateToCheck
      return !found && slot.day === dateToCheck;
    });
    // DEBUG LOG
    console.log("[MissedTaskCheck] Missed lectures/sections:", missedLectSec);

    // 2. Check follow-up study tasks
    const missedStudyTasks = generatedTasks.filter((task) => {
      if (task.type !== "study") return false;
      if (task.day !== dateToCheck) return false;
      // Only check if the slot's end time has passed
      const endTime = parseSlotEndTime(task.time, now);
      const isTimePassed = endTime && now > endTime;
      const isNotCompleted = !completedTasks.some(
        (ct) =>
          ct.type === "study" &&
          ct.subject === task.subject &&
          ct.day === task.day &&
          ct.time === task.time
      );
      return isTimePassed && isNotCompleted;
    });
    // DEBUG LOG
    console.log("[MissedTaskCheck] Missed study tasks:", missedStudyTasks);

    // Add missed lectures/sections to missedTasks
    if (missedLectSec.length > 0) {
      setMissedTasks((prev) => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const newMissed = [
          ...prev,
          ...missedLectSec.map((task) => ({
            ...task,
            courseID:
              task.courseID ||
              (currentUser?.courses ? currentUser.courses[0] : null),
          })),
        ];
        // Remove duplicates
        return newMissed.filter(
          (task, idx, self) =>
            idx ===
            self.findIndex(
              (t) =>
                t.type === task.type &&
                t.subject === task.subject &&
                t.day === task.day &&
                t.time === task.time
            )
        );
      });
    }
    // Add missed study tasks to missedTasks
    if (missedStudyTasks.length > 0) {
      setMissedTasks((prev) => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const newMissed = [
          ...prev,
          ...missedStudyTasks.map((t) => ({
            ...t,
            type: "study",
            courseID:
              t.courseID ||
              (currentUser?.courses ? currentUser.courses[0] : null),
          })),
        ];
        // Remove duplicates
        return newMissed.filter(
          (task, idx, self) =>
            idx ===
            self.findIndex(
              (tt) =>
                tt.type === task.type &&
                tt.subject === task.subject &&
                tt.day === task.day &&
                tt.time === task.time
            )
        );
      });
    }
    // Remove completed study tasks from generatedTasks
    setGeneratedTasks((prev) =>
      prev.filter(
        (task) =>
          !(
            task.type === "study" &&
            completedTasks.some(
              (ct) =>
                ct.type === "study" &&
                ct.subject === task.subject &&
                ct.day === task.day &&
                ct.time === task.time
            )
          )
      )
    );
  };

  // Function to save missed tasks to database
  const saveMissedTasksToDatabase = async () => {
    if (!userId) return;
    try {
      await axios.put(
        `http://localhost:5100/api/user/insights/${userId}`,
        weeklyTasks
      );
      console.log("Missed tasks saved to database");
    } catch (error) {
      console.error("Error saving missed tasks:", error);
    }
  };

  // Effect to fetch weekly tasks from backend on mount
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) {
        setIsTasksLoaded(true);
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:5100/api/user/insights/${userId}`
        );
        setWeeklyTasks(response.data || {});
      } catch (error) {
        setWeeklyTasks({});
      } finally {
        setIsTasksLoaded(true);
      }
    };
    fetchTasks();
  }, [userId]);

  // Effect to save weekly tasks to backend whenever weeklyTasks changes (after initial load)
  useEffect(() => {
    if (!isTasksLoaded || !userId) return;
    axios.put(`http://localhost:5100/api/user/insights/${userId}`, weeklyTasks);
  }, [weeklyTasks, isTasksLoaded, userId]);

  // Effect to reset for a new week (on Sunday)
  useEffect(() => {
    const today = new Date();
    if (today.getDay() === 0) {
      // Sunday
      if (!weeklyTasks[currentWeekKey]) {
        // Start a new week with empty arrays
        setWeeklyTasks((prev) => ({
          ...prev,
          [currentWeekKey]: {
            completedTasks: [],
            missedTasks: [],
            generatedTasks: [],
          },
        }));
      }
    }
  }, [currentWeekKey, weeklyTasks]);

  // Update all usages of setCompletedTasks, setMissedTasks, setGeneratedTasks
  const setCompletedTasks = (fn) => {
    setWeeklyTasks((prev) => {
      const week = prev[currentWeekKey] || {
        completedTasks: [],
        missedTasks: [],
        generatedTasks: [],
      };
      const newCompletedTasks =
        typeof fn === "function" ? fn(week.completedTasks) : fn;
      // Also update localStorage for Calendar access
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (currentUser) {
        currentUser.completedTasks = newCompletedTasks;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      }
      return {
        ...prev,
        [currentWeekKey]: {
          ...week,
          completedTasks: newCompletedTasks,
        },
      };
    });
  };
  const setMissedTasks = (fn) => {
    setWeeklyTasks((prev) => {
      const week = prev[currentWeekKey] || {
        completedTasks: [],
        missedTasks: [],
        generatedTasks: [],
      };
      return {
        ...prev,
        [currentWeekKey]: {
          ...week,
          missedTasks: typeof fn === "function" ? fn(week.missedTasks) : fn,
        },
      };
    });
  };
  const setGeneratedTasks = (fn) => {
    setWeeklyTasks((prev) => {
      const week = prev[currentWeekKey] || {
        completedTasks: [],
        missedTasks: [],
        generatedTasks: [],
      };
      return {
        ...prev,
        [currentWeekKey]: {
          ...week,
          generatedTasks:
            typeof fn === "function" ? fn(week.generatedTasks) : fn,
        },
      };
    });
  };

  // On app load, if lastCheckedDate is not today and current time is after scheduled time, run the missed task check for today
  useEffect(() => {
    if (!isTasksLoaded) return;
    const today = getDateString();
    const now = new Date();
    const scheduledHour = 23;
    const scheduledMinute = 59;
    console.log(
      "[CatchUp] Effect running. lastCheckedDate:",
      lastCheckedDate,
      "today:",
      today,
      "now:",
      now.toLocaleString()
    );
    if (
      lastCheckedDate !== today &&
      (now.getHours() > scheduledHour ||
        (now.getHours() === scheduledHour &&
          now.getMinutes() >= scheduledMinute))
    ) {
      console.log(
        "[CatchUp] Running missed task check for today on app load. lastCheckedDate:",
        lastCheckedDate,
        "today:",
        today
      );
      checkForMissedTasksEndOfDay(today);
      setLastCheckedDate(today);
      console.log("[CatchUp] lastCheckedDate updated to:", today);
    } else {
      console.log(
        "[CatchUp] No catch-up needed. lastCheckedDate:",
        lastCheckedDate,
        "today:",
        today,
        "now:",
        now.toLocaleString()
      );
    }
  }, [isTasksLoaded, lastCheckedDate, generatedTasks, completedTasks]);

  // Effect to set up daily midnight check for missed sessions
  useEffect(() => {
    if (!isTasksLoaded) return;

    const scheduleMidnightCheck = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(23, 59, 0, 0); // 11:59 PM today
      if (now > target) {
        // If it's already past 11:59 PM, set for tomorrow
        target.setDate(target.getDate() + 1);
      }
      console.log("[Timer] Scheduled for:", target.toLocaleString());
      const timeUntilTarget = target.getTime() - now.getTime();
      const timeoutId = setTimeout(() => {
        console.log(
          "[Timer] Missed task check running at",
          new Date().toLocaleString()
        );
        checkForMissedTasksEndOfDay();
        scheduleMidnightCheck();
      }, timeUntilTarget);
      return timeoutId;
    };

    const timeoutId = scheduleMidnightCheck();

    return () => clearTimeout(timeoutId);
  }, [isTasksLoaded, generatedTasks, completedTasks, userId]);

  // Save missedTasks to database whenever missedTasks changes (after initial load)
  useEffect(() => {
    if (!isTasksLoaded || !userId) return;
    if (missedTasks.length > 0) {
      saveMissedTasksToDatabase();
    }
  }, [missedTasks]);

  // Add this function below setCompletedTasks
  const setCompletedTasksForWeek = (weekKey, fn) => {
    setWeeklyTasks((prev) => {
      const week = prev[weekKey] || {
        completedTasks: [],
        missedTasks: [],
        generatedTasks: [],
      };
      const newCompletedTasks =
        typeof fn === "function" ? fn(week.completedTasks) : fn;
      // Optionally update localStorage here if needed
      return {
        ...prev,
        [weekKey]: {
          ...week,
          completedTasks: newCompletedTasks,
        },
      };
    });
  };

  // Add this function to get completedTasks for any week
  const getCompletedTasksForWeek = (weekKey) => {
    return weeklyTasks[weekKey]?.completedTasks || [];
  };

  return (
    <TasksContext.Provider
      value={{
        completedTasks,
        setCompletedTasks,
        setCompletedTasksForWeek,
        getCompletedTasksForWeek,
        missedTasks,
        setMissedTasks,
        generatedTasks,
        setGeneratedTasks,
        checkForMissedTasksEndOfDay,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);

// Helper to get the start of the week (Sunday) for a given date
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get the week key string
function getWeekKey(date = new Date()) {
  const weekStart = getWeekStart(date);
  const dd = String(weekStart.getDate()).padStart(2, "0");
  const mm = String(weekStart.getMonth() + 1).padStart(2, "0");
  const yyyy = weekStart.getFullYear();
  return `week of ${dd}/${mm}/${yyyy}`;
}

// Export getWeekKey for use in forms
export { getWeekKey };
