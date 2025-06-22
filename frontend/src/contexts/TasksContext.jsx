import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  // Store all weeks' data in an object
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const isInitialMount = useRef(true);

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

  // Helper to get scheduled tasks for a specific date from timetable
  const getScheduledTasksForDate = (dateString) => {
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
    // Use the provided date string to determine the day of the week, adding T12:00:00 to avoid timezone issues
    const checkDate = new Date(`${dateString}T12:00:00`);
    const dayName = daysOfWeek[checkDate.getDay()];
    const daySchedule = schedule[dayName] || {};
    const result = [];
    for (const time in daySchedule) {
      const content = daySchedule[time];
      if (content.startsWith("Lec:")) {
        result.push({
          type: "lecture",
          subject: content.replace(/^Lec:\s*/, "").trim(),
          day: dateString,
          time,
        });
      } else if (content.startsWith("Sec:")) {
        result.push({
          type: "section",
          subject: content.replace(/^Sec:\s*/, "").trim(),
          day: dateString,
          time,
        });
      } else if (content.startsWith("Study:")) {
        result.push({
          type: "study",
          subject: content.replace(/^Study:\s*/, "").trim(),
          day: dateString,
          time,
        });
      }
    }
    return result;
  };

  // This is a new, pure function. It calculates missed tasks for a specific date
  // using the provided data, without causing any side effects.
  const calculateMissedTasksForDate = (dateString, allTasks) => {
    const weekKey = getWeekKey(new Date(dateString));
    const tasksForWeek = allTasks[weekKey] || {
      completedTasks: [],
      generatedTasks: [],
    };
    const {
      completedTasks: completedTasksForWeek,
      generatedTasks: generatedTasksForWeek,
    } = tasksForWeek;

    const scheduled = getScheduledTasksForDate(dateString);

    const missedScheduled = scheduled.filter((slot) => {
      const isCompleted = completedTasksForWeek.some(
        (ct) =>
          ct.type === slot.type &&
          ct.subject === slot.subject &&
          ct.day === dateString &&
          ct.time === slot.time
      );
      return !isCompleted;
    });

    // Also check for generated study tasks on that day that were not completed
    const missedGeneratedStudy = (generatedTasksForWeek || []).filter(
      (task) => {
        if (task.type !== "study" || task.day !== dateString) return false;
        const isCompleted = completedTasksForWeek.some(
          (ct) =>
            ct.type === "study" &&
            ct.subject === task.subject &&
            ct.day === task.day &&
            ct.time === task.time
        );
        return !isCompleted;
      }
    );

    const allMissed = [...missedScheduled, ...missedGeneratedStudy];

    // Add courseID to new missed tasks
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    return allMissed.map((task) => ({
      ...task,
      courseID:
        task.courseID || (currentUser?.courses ? currentUser.courses[0] : null),
    }));
  };

  // Unified effect to fetch, catch up, and set initial state
  useEffect(() => {
    const initializeAndCatchUp = async () => {
      if (!userId) {
        setIsTasksLoaded(true);
        return;
      }

      try {
        // 1. Fetch initial data
        const response = await axios.get(
          `http://localhost:5100/api/user/insights/${userId}`
        );
        let tasksData = response.data || {};
        let wasUpdated = false;

        // 2. Run catch-up logic
        const lastDateString = localStorage.getItem("lastCheckedDate");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lastDateString) {
          const lastDate = new Date(lastDateString);
          lastDate.setHours(0, 0, 0, 0);

          if (lastDate < today) {
            const dateIterator = new Date(lastDate);
            dateIterator.setDate(dateIterator.getDate() + 1);

            while (dateIterator < today) {
              const dateString = getDateString(dateIterator);
              const newMissed = calculateMissedTasksForDate(
                dateString,
                tasksData
              );

              if (newMissed.length > 0) {
                wasUpdated = true;
                const weekKey = getWeekKey(dateIterator);
                if (!tasksData[weekKey]) {
                  tasksData[weekKey] = {
                    completedTasks: [],
                    missedTasks: [],
                    generatedTasks: [],
                  };
                }
                const existingMissed = tasksData[weekKey].missedTasks || [];
                const combinedMissed = [...existingMissed];
                newMissed.forEach((missedTask) => {
                  if (
                    !combinedMissed.some(
                      (t) =>
                        t.day === missedTask.day &&
                        t.time === missedTask.time &&
                        t.subject === missedTask.subject
                    )
                  ) {
                    combinedMissed.push(missedTask);
                  }
                });
                tasksData[weekKey].missedTasks = combinedMissed;
              }
              dateIterator.setDate(dateIterator.getDate() + 1);
            }
          }
        }

        // 3. If changes were made, save to DB and update local storage date
        if (wasUpdated) {
          await axios.put(
            `http://localhost:5100/api/user/insights/${userId}`,
            tasksData
          );
          // IMPORTANT: Update the date in local storage only after a successful save
          localStorage.setItem("lastCheckedDate", getDateString(today));
        }

        // 4. Set state once with the final result
        setWeeklyTasks(tasksData);
      } catch (error) {
        console.error("Error during initialization and catch-up:", error);
        setWeeklyTasks({});
      } finally {
        setIsTasksLoaded(true);
      }
    };

    initializeAndCatchUp();
  }, [userId]);

  // Effect to save weekly tasks to backend whenever they change
  useEffect(() => {
    // We don't want to save on the very first render cycle.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isTasksLoaded || !userId) return;

    axios
      .put(`http://localhost:5100/api/user/insights/${userId}`, weeklyTasks)
      .catch((err) => {
        console.error("[DB Save] Error saving to database:", err);
      });
  }, [weeklyTasks, userId, isTasksLoaded]);

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
          "[Timer] Midnight check running at",
          new Date().toLocaleString()
        );
        // Rerun the check for today and update state
        const todayString = getDateString();
        const newMissed = calculateMissedTasksForDate(todayString, weeklyTasks);
        console.log(
          `[Timer] Found ${newMissed.length} missed tasks for today.`
        );
        if (newMissed.length > 0) {
          const weekKey = getWeekKey(new Date());
          console.log(`[Timer] Updating missed tasks for week ${weekKey}.`);
          setWeeklyTasks((prev) => {
            const week = prev[weekKey] || {
              completedTasks: [],
              missedTasks: [],
              generatedTasks: [],
            };
            const combined = [...(week.missedTasks || [])];
            newMissed.forEach((missedTask) => {
              if (
                !combined.some(
                  (t) =>
                    t.day === missedTask.day &&
                    t.time === missedTask.time &&
                    t.subject === missedTask.subject
                )
              ) {
                combined.push(missedTask);
              }
            });
            return {
              ...prev,
              [weekKey]: { ...week, missedTasks: combined },
            };
          });
        }
        localStorage.setItem("lastCheckedDate", todayString);
        scheduleMidnightCheck();
      }, timeUntilTarget);
      return timeoutId;
    };

    const timeoutId = scheduleMidnightCheck();

    return () => clearTimeout(timeoutId);
  }, [isTasksLoaded, weeklyTasks, userId]);

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

  const setMissedTasksForWeek = (weekKey, fn) => {
    setWeeklyTasks((prev) => {
      const week = prev[weekKey] || {
        completedTasks: [],
        missedTasks: [],
        generatedTasks: [],
      };
      const newMissedTasks =
        typeof fn === "function" ? fn(week.missedTasks) : fn;
      return {
        ...prev,
        [weekKey]: {
          ...week,
          missedTasks: newMissedTasks,
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
        setMissedTasksForWeek,
        getCompletedTasksForWeek,
        missedTasks,
        setMissedTasks,
        generatedTasks,
        setGeneratedTasks,
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
