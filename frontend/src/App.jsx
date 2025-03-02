import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const criteria = ["Computation", "Memorization", "Creativity", "Analysis"];
  const [scores, setScores] = useState({
    Computation: 1,
    Memorization: 1,
    Creativity: 1,
    Analysis: 1,
  });

  const handleScoreChange = (criterion, value) => {
    setScores((prevState) => ({ ...prevState, [criterion]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5100/submit-scores",
        scores
      );

      console.log("Response from server: ", response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-xl">
        <h2 className="text-xl font-semibold mb-4">
          Rate Each Criterion For Your Subject
        </h2>
        <form onSubmit={(e) => handleSubmit(e)}>
          {criteria.map((criterion) => (
            <div key={criterion} className="mb-4">
              <label className="block font-medium mb-1">{criterion}</label>
              <div className="flex space-x-4">
                {[1, 2, 3, 4, 5].map((score) => (
                  <label key={score} className="flex items-center space-x-1">
                    <input
                      type="radio"
                      name={criterion}
                      value={score}
                      checked={scores[criterion] === score}
                      onChange={() => handleScoreChange(criterion, score)}
                      className="hidden"
                    />
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer border transition ${
                        scores[criterion] === score
                          ? "bg-blue-500 text-white"
                          : "border-gray-300"
                      } `}
                    >
                      {score}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="block mx-auto border rounded-sm py-1 px-3 text-md bg-green-600 text-white hover:bg-green-700 transition cursor-pointer"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
