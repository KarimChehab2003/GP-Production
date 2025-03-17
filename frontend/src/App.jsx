import React, { useState } from "react";
import SignIn from "./pages/SignIn";
import Registration from "./pages/Registration";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import Dashboard from "./pages/Dashboard";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          index
          element={<Registration />}
        />
        <Route
          path="/login"
          element={<SignIn />}
        />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
