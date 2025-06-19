import { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { Outlet, Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./SideNav";
import Calendar from "../components/Calendar";
import Tasks from "./Tasks";
import Insights from "./Insights";
import SettingsModal from "../components/SettingsModal";

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
            className="mb-2 px-4 py-2 bg-yellow-400 rounded cursor-pointer"
          >
            {ignoreSlotRestrictions ? "Disable" : "Enable"} Slot Click
            Restrictions (added this button for testing purposes)
          </button>
          <Routes>
            <Route
              path="study-plan"
              element={
                <Calendar ignoreSlotRestrictions={ignoreSlotRestrictions} />
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
