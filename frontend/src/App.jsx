import React, { useState } from "react";
import SignIn from "./pages/SignIn";
import Registration from "./pages/Registration";
const App = () => {
  const [currentUser, setCurrentUser] = useState({});
  return (
    <div>
      <Registration setCurrentUser={setCurrentUser} />
      {/* <SignIn setCurrentUser={setCurrentUser} /> */}
    </div>
  );
};

export default App;
