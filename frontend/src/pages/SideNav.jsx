import { useEffect, useState } from "react";
import { FaRegCalendarAlt, FaTasks } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { GoGraph } from "react-icons/go";
import { NavLink } from "react-router-dom";

function SideNav() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    setDate(new Date());
  }, []);

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
      <div className="flex justify-start items-center space-x-2 text-xl cursor-pointer hover:bg-indigo-100 rounded-md py-2 px-4 transition duration-300 w-full">
        <IoIosSettings />
        <p>Settings</p>
      </div>
    </aside>
  );
}

export default SideNav;
