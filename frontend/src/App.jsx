import React, { useState } from "react";
import LoginPage from "./components/pages/LoginPage";
const App = () => {
  const [currentUser, setCurrentUser] = useState({});
  return (
    <div>
      <LoginPage setCurrentUser={setCurrentUser} />
    </div>
  );
};

export default App;
