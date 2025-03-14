import React, { useState } from "react";
import SignIn from "./pages/SignIn";
import Registration from "./pages/Registration";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import Dashboard from "./pages/Dashboard";
const App = () => {
  const [currentUser, setCurrentUser] = useState({});
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          index
          element={<Registration setCurrentUser={setCurrentUser} />}
        />
        <Route
          path="/login"
          element={<SignIn setCurrentUser={setCurrentUser} />}
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      {/* <Registration setCurrentUser={setCurrentUser} /> */}
      {/* <SignIn setCurrentUser={setCurrentUser} /> */}
    </Router>
  );
};

export default App;
