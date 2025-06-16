import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [isTasksLoaded, setIsTasksLoaded] = useState(false); // To prevent saving before initial load

  // Get userId from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const userId = currentUser?.id;

  // Effect to fetch tasks from backend on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) {
        console.warn("TasksContext - No user ID found, cannot fetch tasks.");
        setIsTasksLoaded(true);
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:5100/api/user/insights/${userId}`
        );
        setTasks(response.data.completedTasks || []);
        console.log(
          "TasksContext - Fetched tasks from backend:",
          response.data.completedTasks || []
        );
      } catch (error) {
        console.error(
          "TasksContext - Failed to fetch tasks from backend:",
          error
        );
        setTasks([]); // Initialize with empty array on error
      } finally {
        setIsTasksLoaded(true);
      }
    };

    fetchTasks();
  }, [userId]); // Re-run if userId changes (e.g., after login/logout)

  // Effect to save tasks to backend whenever tasks state changes (after initial load)
  useEffect(() => {
    if (!isTasksLoaded || !userId) {
      return; // Don't save if not yet loaded or no user ID
    }

    const saveTasks = async () => {
      console.log("TasksContext - Saving tasks to backend:", tasks);
      try {
        const response = await axios.put(
          `http://localhost:5100/api/user/insights/${userId}`,
          {
            completedTasks: tasks,
          }
        );
        console.log("TasksContext - Tasks saved to backend successfully!");

        const { weeklyReportId } = response.data;
        if (weeklyReportId && currentUser) {
          const updatedUser = { ...currentUser, weekly_report: weeklyReportId };

          localStorage.setItem("currentUser", JSON.stringify(updatedUser));

          // Also update the user in the database with the weeklyReportId
          await axios.put(`http://localhost:5100/api/quiz/update-user`, {
            userId,
            weekly_report: weeklyReportId,
          });
        }
      } catch (error) {
        console.error("TasksContext - Failed to save tasks to backend:", error);
      }
    };

    // Debounce or throttle this if tasks update very frequently
    const handler = setTimeout(() => {
      saveTasks();
    }, 500); // Save after 500ms of no changes

    return () => {
      clearTimeout(handler);
    };
  }, [tasks, isTasksLoaded, userId]); // Depend on tasks, load status, and userId

  return (
    <TasksContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);
