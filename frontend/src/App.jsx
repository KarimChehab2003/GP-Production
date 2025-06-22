import React from "react";
import SignIn from "./pages/SignIn";
import Registration from "./pages/Registration";
import Main from "./pages/Main";
import Layout from "./pages/Layout";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { TasksProvider } from "./contexts/TasksContext";

const App = () => {
  return (
    <TasksProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/signup" element={<Registration />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/dashboard/*" element={<Layout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </TasksProvider>
  );
};

export default App;
