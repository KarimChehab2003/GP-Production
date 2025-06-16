import React from "react";
import SignIn from "./pages/SignIn";
import Registration from "./pages/Registration";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./pages/Layout";
import Calendar from "./components/Calendar";
import Tasks from "./pages/Tasks";
import Insights from "./pages/Insights";
import { TasksProvider } from "./contexts/TasksContext";

const App = () => {
  return (
    <TasksProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Registration />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/dashboard/*" element={<Layout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </TasksProvider>
  );
};

export default App;
