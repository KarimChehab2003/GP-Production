import React, { useState } from "react";
import LoginPage from "./components/pages/LoginPage";
import Registration from "./components/pages/Registration";
const App = () => {
  const [currentUser, setCurrentUser] = useState({});
  return (
    <div>
      <LoginPage setCurrentUser={setCurrentUser} />
      <Registration setCurrentUser={setCurrentUser}/>
      
    </div>
  );
};

export default App;
