import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  // Store all weeks' data in an object
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [isCalendarReady, setIsCalendarReady] = useState(false);
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

  // Add a ref to track processed missed tasks and prevent double scheduling
  const processedReschedulesRef = useRef(new Set());

  // Load processed reschedules from localStorage on mount
  useEffect(() => {
    const savedProcessedReschedules = localStorage.getItem(
      "processedReschedules"
    );
    if (savedProcessedReschedules) {
      const parsed = JSON.parse(savedProcessedReschedules);
      processedReschedulesRef.current = new Set(parsed);
    }
    // Clean up old processed reschedules
    cleanupOldProcessedReschedules();
  }, []);

  // Save processed reschedules to localStorage whenever it changes
  const saveProcessedReschedules = () => {
    localStorage.setItem(
      "processedReschedules",
      JSON.stringify([...processedReschedulesRef.current])
    );
  };

  // Clean up old processed reschedules (older than 7 days)
  const cleanupOldProcessedReschedules = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoString = oneWeekAgo.toISOString().split("T")[0];

    const filtered = [...processedReschedulesRef.current].filter((key) => {
      const parts = key.split("|");
      if (parts.length >= 1) {
        const taskDate = parts[0]; // day is the first part
        return taskDate >= oneWeekAgoString;
      }
      return true; // Keep if we can't parse the date
    });

    processedReschedulesRef.current = new Set(filtered);
    saveProcessedReschedules();
  };

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

    // Debug: Log scheduled and completed tasks for the date
    console.log(`[DEBUG] Scheduled for ${dateString}:`, scheduled);
    console.log(`[DEBUG] Completed for ${dateString}:`, completedTasksForWeek);

    const missedScheduled = scheduled.filter((slot) => {
      const isCompleted = completedTasksForWeek.some(
        (ct) =>
          ct.type === slot.type &&
          ct.subject === slot.subject &&
          ct.day === dateString &&
          ct.time === slot.time
      );
      if (!isCompleted) {
        console.log(`[DEBUG] Missed scheduled:`, slot);
      }
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
        if (!isCompleted) {
          console.log(`[DEBUG] Missed generated study:`, task);
        }
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

      // Get registration date from user object
      const registeredDateString = currentUser?.registeredDate;
      const registeredDate = registeredDateString
        ? new Date(registeredDateString)
        : null;
      if (registeredDate) registeredDate.setHours(0, 0, 0, 0);

      if (lastDateString) {
        let lastDate = new Date(lastDateString);
        lastDate.setHours(0, 0, 0, 0);

        // Use the later of lastCheckedDate or registeredDate
        if (registeredDate && registeredDate > lastDate) {
          lastDate = new Date(registeredDate);
        }

        if (lastDate < today) {
          const dateIterator = new Date(lastDate);
          dateIterator.setHours(0, 0, 0, 0);
          while (dateIterator < today) {
            const dateString = getDateString(dateIterator);
            console.log(`[DEBUG] Checking missed tasks for ${dateString}`);
            const newMissed = calculateMissedTasksForDate(
              dateString,
              tasksData
            );
            console.log(
              `[DEBUG] Missed tasks found for ${dateString}:`,
              newMissed
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
      }
      // Always update lastCheckedDate after catch-up
      localStorage.setItem("lastCheckedDate", getDateString(today));

      // 4. Set state once with the final result
      setWeeklyTasks(tasksData);
    } catch (error) {
      console.error("Error during initialization and catch-up:", error);
      setWeeklyTasks({});
    } finally {
      setIsTasksLoaded(true);
    }
  };

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

  // Effect to trigger missed tasks checkup when calendar is ready and user is logged in
  useEffect(() => {
    if (isCalendarReady && userId && !isTasksLoaded) {
      console.log(
        "[CALENDAR] Calendar is ready, triggering missed tasks checkup..."
      );
      initializeAndCatchUp();
    }
  }, [isCalendarReady, userId, isTasksLoaded]);

  // Effect to reset calendar ready state when user changes
  useEffect(() => {
    if (!userId) {
      setIsCalendarReady(false);
      setIsTasksLoaded(false);
    }
  }, [userId]);

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

  // Function to remove follow-up tasks from all weeks when a study session is completed
  const removeFollowUpTasksForSubject = (subjectName, lectureNumbers = []) => {
    console.log(
      `[STUDY COMPLETION] Looking for follow-up tasks to remove for subject: ${subjectName}, lectures: ${lectureNumbers.join(
        ", "
      )}`
    );

    setWeeklyTasks((prev) => {
      const updated = { ...prev };
      let removedCount = 0;

      Object.keys(updated).forEach((weekKey) => {
        if (updated[weekKey]?.generatedTasks) {
          const originalLength = updated[weekKey].generatedTasks.length;
          console.log(
            `[STUDY COMPLETION] Checking week ${weekKey} - ${originalLength} generated tasks`
          );

          updated[weekKey].generatedTasks = updated[
            weekKey
          ].generatedTasks.filter((task) => {
            // Remove tasks that match the pattern "Study lecture X in SUBJECT in your next study session"
            if (task.type === "generated" && task.subject) {
              console.log(
                `[STUDY COMPLETION] Found potential task: "${task.subject}"`
              );
              console.log(
                `[STUDY COMPLETION] Looking for subject: "${subjectName}"`
              );

              // Updated regex to match 'Study lecture X in SUBJECT in your next study session'
              const studyPattern = new RegExp(
                `Study lecture (\\d+) in (.+?) in your next study session`,
                "i"
              );
              const match = task.subject.match(studyPattern);

              console.log(
                `[STUDY COMPLETION] Regex pattern: "${studyPattern.source}"`
              );
              console.log(`[STUDY COMPLETION] Match result:`, match);

              if (match) {
                const taskLectureNumber = parseInt(match[1]);
                const taskSubjectName = match[2].trim();

                console.log(
                  `[STUDY COMPLETION] Extracted lecture number: ${taskLectureNumber}`
                );
                console.log(
                  `[STUDY COMPLETION] Extracted subject name: "${taskSubjectName}"`
                );
                console.log(
                  `[STUDY COMPLETION] Target subject name: "${subjectName}"`
                );

                // Check if the subject names match (case-insensitive)
                if (
                  taskSubjectName.toLowerCase() === subjectName.toLowerCase()
                ) {
                  console.log(`[STUDY COMPLETION] Subject names match!`);

                  // If specific lecture numbers are provided, only remove matching ones
                  if (lectureNumbers.length > 0) {
                    if (lectureNumbers.includes(taskLectureNumber)) {
                      console.log(
                        `[STUDY COMPLETION] ✓ Removing follow-up task from week ${weekKey}: ${task.subject} (lecture ${taskLectureNumber} was studied)`
                      );
                      return false; // Remove this task
                    } else {
                      console.log(
                        `[STUDY COMPLETION] ✗ Keeping follow-up task from week ${weekKey}: ${task.subject} (lecture ${taskLectureNumber} was not studied in this session)`
                      );
                      return true; // Keep this task
                    }
                  } else {
                    // If no specific lecture numbers provided, remove all for this subject (backward compatibility)
                    console.log(
                      `[STUDY COMPLETION] Removing follow-up task from week ${weekKey}: ${task.subject} (no specific lectures provided)`
                    );
                    return false; // Remove this task
                  }
                } else {
                  console.log(
                    `[STUDY COMPLETION] Subject names don't match: "${taskSubjectName}" vs "${subjectName}"`
                  );
                }
              } else {
                console.log(
                  `[STUDY COMPLETION] Task did not match the expected pattern`
                );
              }
            }
            return true; // Keep this task
          });
          removedCount +=
            originalLength - updated[weekKey].generatedTasks.length;
        }
      });

      if (removedCount > 0) {
        console.log(
          `[STUDY COMPLETION] Successfully removed ${removedCount} follow-up tasks for subject: ${subjectName}`
        );
      } else {
        console.log(
          `[STUDY COMPLETION] No follow-up tasks found to remove for subject: ${subjectName}`
        );
      }

      return updated;
    });
  };

  // Automatically reschedule missed tasks within 24 hours, finding a free slot
  useEffect(() => {
    if (!isTasksLoaded) return;
    if (!generatedTasks || generatedTasks.length === 0) return;

    // Canonical list of possible timeslots
    const timeslots = [
      "8AM-10AM",
      "10AM-12PM",
      "12PM-2PM",
      "2PM-4PM",
      "4PM-6PM",
      "6PM-8PM",
      "8PM-10PM",
    ];
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    missedTasks.forEach((missedTask, idx) => {
      // Only reschedule missed study sessions
      if (missedTask.type !== "study") return;
      if (missedTask.rescheduleProcessed) return;
      const rescheduleKey = `${missedTask.day}|${missedTask.time}|${missedTask.subject}|${missedTask.type}`;
      // Debug: Show what we're checking for
      console.log(
        "[RESCHEDULE] Checking for already rescheduled:",
        rescheduleKey,
        generatedTasks
      );
      // Prevent double scheduling in this session
      if (processedReschedulesRef.current.has(rescheduleKey)) return;

      // Check if already rescheduled in any week in the database
      const alreadyRescheduledInAnyWeek = Object.values(weeklyTasks).some(
        (week) =>
          week.generatedTasks &&
          week.generatedTasks.some(
            (task) => task.rescheduledFrom === rescheduleKey
          )
      );

      const alreadyRescheduled = generatedTasks.some(
        (task) => task.rescheduledFrom === rescheduleKey
      );

      if (alreadyRescheduled || alreadyRescheduledInAnyWeek) {
        console.log(
          "[RESCHEDULE] Already rescheduled, skipping:",
          rescheduleKey
        );
        // Mark as processed to prevent future attempts
        processedReschedulesRef.current.add(rescheduleKey);
        saveProcessedReschedules();
        return;
      }
      // Try to find a free slot within 24 hours after the missed session
      const missedDate = new Date(missedTask.day + "T00:00:00");
      let found = false;
      for (let dayOffset = 1; dayOffset <= 1 && !found; dayOffset++) {
        // Only next day (24 hours)
        const newDate = new Date(missedDate);
        newDate.setDate(missedDate.getDate() + dayOffset);
        const yyyy = newDate.getFullYear();
        const mm = String(newDate.getMonth() + 1).padStart(2, "0");
        const dd = String(newDate.getDate()).padStart(2, "0");
        const newDateString = `${yyyy}-${mm}-${dd}`;
        const dayName = daysOfWeek[newDate.getDay()];
        // Get current user's schedule from localStorage
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (
          !currentUser ||
          !currentUser.timetable ||
          !currentUser.timetable.schedule
        )
          continue;
        if (!currentUser.timetable.schedule[dayName]) {
          currentUser.timetable.schedule[dayName] = {};
        }
        for (const slot of timeslots) {
          if (
            !currentUser.timetable.schedule[dayName][slot] ||
            currentUser.timetable.schedule[dayName][slot] === ""
          ) {
            // Found a free slot
            let rescheduledType = "rescheduled-" + missedTask.type;
            const newTask = {
              ...missedTask,
              day: newDateString,
              time: slot,
              rescheduledFrom: rescheduleKey,
              isRescheduled: true,
              type: rescheduledType,
              subject: missedTask.subject, // Use original subject name
              originalSubject: missedTask.subject, // Keep original for reference
            };
            setGeneratedTasks((prev) => [...prev, newTask]);
            // Add to timetable with rescheduled indicator
            currentUser.timetable.schedule[dayName][
              slot
            ] = `Study: ${missedTask.subject} (Rescheduled)`;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            // --- Update weeklyTasks state to reflect the new generated task and updated schedule ---
            setWeeklyTasks((prev) => {
              // Find the week key for the new date
              const weekKey = getWeekKey(newDate);
              const week = prev[weekKey] || {
                completedTasks: [],
                missedTasks: [],
                generatedTasks: [],
              };
              // Add the new generated task if not already present
              const alreadyInGenerated = week.generatedTasks.some(
                (t) =>
                  t.day === newTask.day &&
                  t.time === newTask.time &&
                  t.subject === newTask.subject &&
                  t.type === newTask.type
              );
              const updatedGeneratedTasks = alreadyInGenerated
                ? week.generatedTasks
                : [...week.generatedTasks, newTask];
              // Mark the missed task as processed in missedTasks
              const updatedMissedTasks = week.missedTasks.map((mt) =>
                mt.day === missedTask.day &&
                mt.time === missedTask.time &&
                mt.subject === missedTask.subject &&
                mt.type === missedTask.type
                  ? { ...mt, rescheduleProcessed: true }
                  : mt
              );
              return {
                ...prev,
                [weekKey]: {
                  ...week,
                  generatedTasks: updatedGeneratedTasks,
                  missedTasks: updatedMissedTasks,
                },
              };
            });
            // Mark this missed task as processed for this session
            processedReschedulesRef.current.add(rescheduleKey);
            saveProcessedReschedules();
            // Save the updated timetable to the backend using the correct endpoint
            axios
              .put("http://localhost:5100/api/quiz/update-user", {
                userId: currentUser.id,
                timetable: { schedule: currentUser.timetable.schedule },
              })
              .catch((err) => {
                console.error(
                  "Failed to save updated timetable to backend:",
                  err
                );
              });
            found = true;
            break;
          }
        }
      }
    });
  }, [missedTasks, isTasksLoaded, generatedTasks, setGeneratedTasks]);

  const triggerMissedTasksCheckup = async () => {
    if (!userId || isTasksLoaded) return; // Don't run if already loaded or no user

    console.log("[CALENDAR] Triggering missed tasks checkup...");
    await initializeAndCatchUp();
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
        isTasksLoaded,
        isCalendarReady,
        setIsCalendarReady,
        triggerMissedTasksCheckup,
        removeFollowUpTasksForSubject,
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
