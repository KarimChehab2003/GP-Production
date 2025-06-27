import { useEffect, useState } from "react";
import { FaRegCalendarAlt, FaTasks } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IoIosSettings } from "react-icons/io";
import { GoGraph } from "react-icons/go";
import { NavLink } from "react-router-dom";

function SideNav({ setIsSettingsModalOpen, setSettingsModalType }) {
  const [date, setDate] = useState(new Date());
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setDate(new Date());
  }, []);

  const logout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("processedReschedules");
    navigate("/login");
  };

  return (
    <aside className="flex flex-col justify-between items-start p-4 border-2 border-indigo-500 min-w-[200px] max-w-xs">
      <div className="space-y-8 w-full">
        <div className="flex flex-col justify-center items-center text-center mx-auto">
          <p className="text-8xl font-bold text-indigo-500">{date.getDate()}</p>
          <p className="text-2xl font-semibold capitalize">
            {date.toLocaleDateString("en-US", { month: "long" }) +
              " " +
              date.getFullYear()}
          </p>
        </div>

        <ul className="list-none space-y-4 w-full">
          <li>
            <NavLink
              to="/dashboard/study-plan"
              className={({ isActive }) =>
                `flex items-center space-x-2 text-xl cursor-pointer rounded-md py-2 px-4 transition duration-300 ${
                  isActive ? "bg-indigo-500 text-white" : "hover:bg-indigo-100"
                }`
              }
            >
              <FaRegCalendarAlt />
              <p>Study Plan</p>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/tasks"
              className={({ isActive }) =>
                `flex items-center space-x-2 text-xl cursor-pointer rounded-md py-2 px-4 transition duration-300 ${
                  isActive ? "bg-indigo-500 text-white" : "hover:bg-indigo-100"
                }`
              }
            >
              <FaTasks />
              <p>Tasks</p>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard/insights"
              className={({ isActive }) =>
                `flex items-center space-x-2 text-xl cursor-pointer rounded-md py-2 px-4 transition duration-300 ${
                  isActive ? "bg-indigo-500 text-white" : "hover:bg-indigo-100"
                }`
              }
            >
              <GoGraph />
              <p>Insights</p>
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="flex justify-center items-center space-x-2 text-xl cursor-pointer settings-container relative">
        <div
          className="flex items-center space-x-2"
          onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
        >
          <IoIosSettings />
          <p>Settings</p>
        </div>

        {showSettingsDropdown && (
          <div className="absolute left-30 bottom-0 mt-2 w-60 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setIsSettingsModalOpen(true);
                setShowSettingsDropdown(false);
                setSettingsModalType("profile");
              }}
            >
              Update My Profile
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setIsSettingsModalOpen(true);
                setShowSettingsDropdown(false);
                setSettingsModalType("conflicts");
              }}
            >
              Schedule Conflicts
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setIsSettingsModalOpen(true);
                setShowSettingsDropdown(false);
                setSettingsModalType("collegeSchedule");
              }}
            >
              Change My College Schedule
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setIsSettingsModalOpen(true);
                setShowSettingsDropdown(false);
                setSettingsModalType("externalActivities");
              }}
            >
              Change My External Activities
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => logout()}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default SideNav;
