import { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { Outlet, Routes, Route, Navigate } from "react-router-dom";
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

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalType, setSettingsModalType] = useState("");

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("currentUser")) || {});
  }, []);

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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-500 flex justify-between items-center text-white py-4 px-8 flex-shrink-0">
        <p className="text-2xl font-semibold">ASPG</p>
        <div className="flex justify-center items-center space-x-4">
          <p>Welcome, {currentUser.fname + " " + currentUser.lname}</p>
          <FaBell className="text-xl cursor-pointer hover:text-indigo-200 transition-colors" />
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
            {ignoreSlotRestrictions ? "Disable" : "Enable"} Slot Click
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
