import { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { Outlet, Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./SideNav";
import Calendar from "../components/Calendar";
import Tasks from "./Tasks";
import Insights from "./Insights";

function Layout() {
  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("currentUser")) || {});
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-500 flex justify-between items-center text-white py-4 px-8">
        <p className="text-2xl font-semibold">ASPG</p>
        <div className="flex justify-center items-center space-x-4">
          <p>Welcome, {currentUser.fname + " " + currentUser.lname}</p>
          <FaBell className="text-xl cursor-pointer hover:text-indigo-200 transition-colors" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <SideNav />

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <Routes>
            <Route path="study-plan" element={<Calendar />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="insights" element={<Insights />} />
            <Route path="*" element={<Navigate to="study-plan" replace />} />
          </Routes>
        </main>
      </div>
    </main>
  );
}

export default Layout;
