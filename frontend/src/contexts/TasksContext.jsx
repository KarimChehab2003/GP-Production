import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [missedTasks, setMissedTasks] = useState([]);
  const [isTasksLoaded, setIsTasksLoaded] = useState(false);
  const [lastCheckedDate, setLastCheckedDate] = useState(null);

  // Get userId from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const userId = currentUser?.id;

  // Helper to get today's date string (YYYY-MM-DD)
  const getDateString = (date = new Date()) => date.toISOString().split("T")[0];

  // Effect to fetch tasks from backend on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) {
        setIsTasksLoaded(true);
        return;
      }
      try {
        const response = await axios.get(
          `http://localhost:5100/api/user/insights/${userId}`
        );
        // Expecting backend to return { generatedTasks, completedTasks, missedTasks }
        setGeneratedTasks(response.data.generatedTasks || []);
        setCompletedTasks(response.data.completedTasks || []);
        setMissedTasks(response.data.missedTasks || []);
        setLastCheckedDate(getDateString());
      } catch (error) {
        setGeneratedTasks([]);
        setCompletedTasks([]);
        setMissedTasks([]);
      } finally {
        setIsTasksLoaded(true);
      }
    };
    fetchTasks();
  }, [userId]);

  // Effect to save tasks to backend whenever any tasks array changes (after initial load)
  useEffect(() => {
    if (!isTasksLoaded || !userId) return;
    const saveTasks = async () => {
      try {
        await axios.put(`http://localhost:5100/api/user/insights/${userId}`, {
          generatedTasks,
          completedTasks,
          missedTasks,
        });
      } catch (error) {
        // Handle error
      }
    };
    const handler = setTimeout(() => {
      saveTasks();
    }, 500);
    return () => clearTimeout(handler);
  }, [generatedTasks, completedTasks, missedTasks, isTasksLoaded, userId]);

  // Effect to check for missed tasks at the start of a new day
  useEffect(() => {
    if (!isTasksLoaded) return;
    const today = getDateString();
    if (lastCheckedDate !== today) {
      // Find generated tasks from previous day(s) that are not completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateString(yesterday);
      const missed = generatedTasks.filter(
        (task) =>
          task.day === yesterdayStr &&
          !completedTasks.some(
            (ct) =>
              ct.id === task.id ||
              (ct.subject === task.subject &&
                ct.day === task.day &&
                ct.time === task.time)
          )
      );
      if (missed.length > 0) {
        setMissedTasks((prev) => [...prev, ...missed]);
      }
      setLastCheckedDate(today);
    }
  }, [isTasksLoaded, lastCheckedDate, generatedTasks, completedTasks]);

  return (
    <TasksContext.Provider
      value={{
        generatedTasks,
        setGeneratedTasks,
        completedTasks,
        setCompletedTasks,
        missedTasks,
        setMissedTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);
