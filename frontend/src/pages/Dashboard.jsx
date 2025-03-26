import { useEffect, useState } from "react";
import { FaRegCalendarAlt, FaTasks, FaBell } from "react-icons/fa";
import { IoIosSettings } from "react-icons/io";
import { GoGraph } from "react-icons/go";
import Calendar from "../components/Calendar";

function Dashboard() {
  const [date, setDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState({});
  const [taskList, setTaskList] = useState([]);

  useEffect(() => {
    setDate(new Date());
    setCurrentUser(JSON.parse(localStorage.getItem("currentUser")));
  }, []);

  useEffect(() => {
    console.log(taskList);
  }, [taskList])

  // console.log(currentUser)
  return (
    <section className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="bg-indigo-500 flex justify-between items-center text-white py-4 px-8">
        <p className="text-2xl font-semibold">ASPG</p>
        <div className="flex justify-center items-center space-x-4">
          <p>Welcome, {currentUser.fname + " " + currentUser.lname}</p>
          <FaBell />
        </div>
      </div>

      {/* Dashboard Interface */}
      <div className="flex grow-1 space-x-4 p-4 ">
        {/* Dashboard Nav */}
        <div className="flex flex-col justify-between items-center p-4 border-2 border-indigo-500 min-w-[200px] max-w-xs">
          <div className="space-y-8">
            <div className="flex flex-col justify-center items-center text-center">
              <p className="text-8xl font-bold text-indigo-500">
                {date.getDate()}
              </p>
              <p className="text-2xl font-semibold capitalize">
                {date.toLocaleDateString("en-US", { month: "long" }) +
                  " " +
                  date.getFullYear()}
              </p>
            </div>

            <ul className="list-none space-y-4">
              <li
                className="flex items-center space-x-2 text-xl cursor-pointer focus:bg-indigo-500 focus:text-white rounded-md py-2 px-4 transition duration-300"
                tabIndex={0}
              >
                <FaRegCalendarAlt />
                <p>Study Plan</p>
              </li>
              <li
                className="flex items-center space-x-2 text-xl cursor-pointer focus:bg-indigo-500 focus:text-white rounded-md py-2 px-4 transition duration-300"
                tabIndex={0}
              >
                <FaTasks />
                <p>Tasks</p>
              </li>
              <li
                className="flex items-center space-x-2 text-xl cursor-pointer focus:bg-indigo-500 focus:text-white rounded-md py-2 px-4 transition duration-300"
                tabIndex={0}
              >
                <GoGraph />
                <p>Insights</p>
              </li>
            </ul>
          </div>
          <div className="flex justify-center items-center space-x-2 text-xl cursor-pointer">
            <IoIosSettings />
            <p>Settings</p>
          </div>
        </div>

        {/* Calendar */}
        <Calendar setTaskList={setTaskList} />
      </div>
    </section>
  );
}

export default Dashboard;
