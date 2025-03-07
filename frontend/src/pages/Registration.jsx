import axios from "axios";
import { useState } from "react";
import IntroduceYourselfForm from "../components/introduceYourselfForm";
import CreateAccountForm from "../components/createAccountForm";
import CourseForm from "../components/courseForm";

function Registration() {
  const [createdUser, setCreatedUser] = useState({});
  const [step, setStep] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(createdUser);

    try {
      const response = await axios.post(
        "http://localhost:5100/auth/register",
        createdUser
      );
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
    console.log(createdUser);
  };

  const handlePrevious = () => {
    setStep((prevStep) => prevStep - 1);
  };

  return (
    <section className="min-h-screen flex justify-center items-center bg-indigo-200 ">
      {/* Registration Wizard 1 */}
      {step === 1 && (
        <CreateAccountForm
          createdUser={createdUser}
          setCreatedUser={setCreatedUser}
          handleNext={handleNext}
        />
      )}

      {/* Registration Wizard 2 */}
      {step === 2 && (
        <IntroduceYourselfForm
          createdUser={createdUser}
          setCreatedUser={setCreatedUser}
          handleNext={handleNext}
          handlePrevious={handlePrevious}
        />
      )}

      {/* Registration Wizard 3 */}
      {step === 3 && (
        <CourseForm
          createdUser={createdUser}
          setCreatedUser={setCreatedUser}
          handlePrevious={handlePrevious}
          handleSubmit={handleSubmit}
        />
      )}
    </section>
  );
}

export default Registration;
