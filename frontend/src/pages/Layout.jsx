import { useState, useEffect } from "react";
import { FaBell, FaTrash } from "react-icons/fa";
import { Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./SideNav";
import Calendar from "../components/Calendar";
import Tasks from "./Tasks";
import Insights from "./Insights";
import SettingsModal from "../components/SettingsModal";
import axios from "axios";
import { getWeekKey } from "../contexts/TasksContext";

function Layout() {
  const [currentUser, setCurrentUser] = useState({});
  const [ignoreSlotRestrictions, setIgnoreSlotRestrictions] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalType, setSettingsModalType] = useState("");

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("currentUser")) || {});
  }, []);

  useEffect(() => {
    // Notification logic
    if (currentUser && currentUser.timetable && currentUser.timetable.schedule) {
      const schedule = currentUser.timetable.schedule;
      const { currentDay, currentSlot, currentSlotStart } = getCurrentDayAndSlot();
      if (currentDay && currentSlot && schedule[currentDay] && currentSlot in schedule[currentDay]) {
        const activity = schedule[currentDay][currentSlot];
        if (!activity || activity === "") {
          setNotifications([
            { id: Date.now() + 1, message: "You have a free time slot now" },
          ]);
          const { nextActivity, nextActivityTime } = getNextActivity(schedule, currentDay, currentSlot, currentSlotStart);
          if (nextActivity) {
            setNotifications(prev => [
              ...prev,
              {
                id: Date.now() + 2,
                message: `Your next activity is "${nextActivity}" and is after ${nextActivityTime} hours`,
              },
            ]);
          }
        } else {
          setNotifications([
            { id: Date.now() + 3, message: `You have a "${activity}" now` },
          ]);
        }
      }
    }
  }, [currentUser]);

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  // Handler for the Adapt Schedule button
  const handleAdaptSchedule = async () => {
    try {
      // Get the current user object from localStorage
      const student = JSON.parse(localStorage.getItem("currentUser"));
      const oldSchedule = student.timetable?.schedule;
      const oldConflicts = student.timetable?.conflicts;
      const weekKey = getWeekKey(new Date());

      // Call the backend to get the new study plan
      const response = await axios.post(
        "http://localhost:5100/schedule/adapt-schedule",
        student
      );
      const { studyPlan } = response.data;

      // Save old schedule in the weekly_report collection (use student.id as the document ID)
      let existingWeekData = {};
      try {
        const weekRes = await axios.get(
          `http://localhost:5100/api/user/insights/${student.id}`
        );
        existingWeekData = weekRes.data[weekKey] || {};
      } catch (err) {
        existingWeekData = {};
      }
      // Merge and save old schedule
      await axios.put(`http://localhost:5100/api/user/insights/${student.id}`, {
        [weekKey]: {
          ...existingWeekData,
          oldSchedule: {
            schedule: oldSchedule,
            conflicts: oldConflicts,
          },
        },
      });

      // Set the new schedule and conflicts
      student.timetable = studyPlan;

      // Always set weekly_report to the user ID before saving to localStorage
      student.weekly_report = student.id;
      localStorage.setItem("currentUser", JSON.stringify(student));

      // Debug log: show what will be sent to the backend
      console.log("[DEBUG] Saving to DB:", {
        userId: student.id,
        timetable: student.timetable,
        weekly_report: student.weekly_report,
      });

      // Save to database (update user document)
      const putResponse = await axios.put(
        "http://localhost:5100/api/quiz/update-user",
        {
          userId: student.id,
          timetable: student.timetable,
          weekly_report: student.weekly_report,
        }
      );
      // Debug log: show backend response
      console.log("[DEBUG] Backend response:", putResponse.data);

      setCurrentUser(student); // Update state if needed
      console.log("Adapted Schedule Result:", studyPlan);
    } catch (error) {
      console.error("Error calling adapt-schedule:", error);
    }
  };

  function getCurrentDayAndSlot() {
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();
    
    const slots = [
      { label: "8AM-10AM", start: 8, end: 10 },
      { label: "10AM-12PM", start: 10, end: 12 },
      { label: "12PM-2PM", start: 12, end: 14 },
      { label: "2PM-4PM", start: 14, end: 16 },
      { label: "4PM-6PM", start: 16, end: 18 },
      { label: "6PM-8PM", start: 18, end: 20 },
      { label: "8PM-10PM", start: 20, end: 22 },
    ];
    const currentSlot = slots.find(s => currentHour >= s.start && currentHour < s.end);
    return { currentDay, currentSlot: currentSlot ? currentSlot.label : null, currentSlotStart: currentSlot ? currentSlot.start : null };
  }

  function getNextActivity(schedule, day, slotLabel, slotStart) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let foundCurrent = false;
    let minDiff = Infinity;
    let nextActivity = null;
    let nextActivityTime = null;
    for (let i = 0; i < daysOfWeek.length; i++) {
      const d = daysOfWeek[(daysOfWeek.indexOf(day) + i) % 7];
      const slots = schedule[d] || {};
      for (const slot of [
        "8AM-10AM", "10AM-12PM", "12PM-2PM", "2PM-4PM", "4PM-6PM", "6PM-8PM", "8PM-10PM"
      ]) {
        if (d === day && slotLabel) {
          // Only start looking after the current slot
          if (!foundCurrent && slot === slotLabel) {
            foundCurrent = true;
            continue;
          }
          if (!foundCurrent) continue;
        }
        const activity = slots[slot];
        if (activity && activity !== "") {
          // Calculate hours until this slot
          let slotHour = parseInt(slot.split("-")[0]);
          if (slot.includes("PM") && slotHour !== 12) slotHour += 12;
          if (slot.includes("AM") && slotHour === 12) slotHour = 0;
          let dayDiff = (daysOfWeek.indexOf(d) - daysOfWeek.indexOf(day) + 7) % 7;
          let hourDiff = (dayDiff * 24 + slotHour - slotStart);
          if (hourDiff <= 0) hourDiff += 24 * 7; // wrap around week
          if (hourDiff < minDiff) {
            minDiff = hourDiff;
            nextActivity = activity;
            nextActivityTime = hourDiff;
          }
        }
      }
    }
    return { nextActivity, nextActivityTime: minDiff !== Infinity ? minDiff : null };
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-500 flex justify-between items-center text-white py-4 px-8 flex-shrink-0 relative">
        <p className="text-2xl font-semibold">ASPG</p>
        <div className="flex justify-center items-center space-x-4 relative">
          <p>Welcome, {currentUser.fname + " " + currentUser.lname}</p>
          <div className="relative">
            <FaBell
              className="text-xl cursor-pointer hover:text-indigo-200 transition-colors"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            />
            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5 flex items-center justify-center min-w-[20px] min-h-[20px]">
                {notifications.length}
              </span>
            )}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white text-black rounded shadow-lg z-50">
                <div className="p-3 font-semibold border-b text-center">My Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 hover:bg-gray-100"
                    >
                      <span>{notification.message}</span>
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.filter((n) => n.id !== notification.id)
                          )
                        }
                        aria-label="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <SideNav
          setIsSettingsModalOpen={setIsSettingsModalOpen}
          setSettingsModalType={setSettingsModalType}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <button
            onClick={() => setIgnoreSlotRestrictions((prev) => !prev)}
            className="mb-2 px-4 py-2 bg-yellow-400 rounded cursor-pointer mx-2"
          >
            {ignoreSlotRestrictions ? "Enable" : "Disable"} Slot Click
            Restrictions (added this button for testing purposes)
          </button>
          <Routes>
            <Route
              path="study-plan"
              element={
                <>
                  <button
                    onClick={handleAdaptSchedule}
                    className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Adapt Schedule (Test)
                  </button>
                  <Calendar ignoreSlotRestrictions={ignoreSlotRestrictions} />
                </>
              }
            />
            <Route path="tasks" element={<Tasks />} />
            <Route path="insights" element={<Insights />} />
            <Route path="*" element={<Navigate to="study-plan" replace />} />
          </Routes>

          {isSettingsModalOpen && (
            <SettingsModal
              onClose={handleCloseSettingsModal}
              type={settingsModalType}
              conflicts={currentUser.timetable.conflicts}
              externalActivities={currentUser.extracurricularActivities}
              takesExternalActivities={currentUser.takesCurricularActivities}
              enrolledCourses={currentUser.courses}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Layout;
