import { useState, useRef } from "react";

function Quiz({
  quiz,
  onQuizCompleted, // New prop for callback
}) {
  console.log("Quiz component received quiz prop:", quiz); // Debugging log
  const [isVisible, setIsVisible] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlotsStructure = [
    "8AM-10AM",
    "10AM-12PM",
    "12PM-2PM",
    "2PM-4PM",
    "4PM-6PM",
    "6PM-8PM",
    "8PM-10PM",
  ];

  if (!quiz || !isVisible) return null;

  const handleChange = (type, idx, value) => {
    setUserAnswers((prev) => ({
      ...prev,
      [`${type}-${idx}`]: value,
    }));
  };

  // Helper to check if an answer is correct
  const isCorrect = (type, idx, correct, q = null) => {
    const user = userAnswers[`${type}-${idx}`];
    if (user == null || user === "") return false;

    if (type === "multipleChoice" && q) {
      const userSelectedText = q.options[user]?.trim().toLowerCase();
      let correctAnswerText;

      // Check if the provided 'correct' answer (q.answer) is one of the keys (A/B/C/D)
      if (q.options && Object.keys(q.options).includes(correct)) {
        correctAnswerText = q.options[correct]?.trim().toLowerCase();
      } else {
        // Otherwise, assume 'correct' is already the text value
        correctAnswerText = correct?.trim().toLowerCase();
      }
      return userSelectedText === correctAnswerText;
    }

    if (type === "fillInTheBlank") {
      if (typeof correct === "string") {
        const possibleAnswers = correct
          .split(",")
          .map((ans) => ans.trim().toLowerCase());
        return possibleAnswers.includes(user.trim().toLowerCase());
      }
    }

    if (type === "trueFalse") {
      const userAnswer = user.trim().toLowerCase();
      const correctAnswer =
        typeof correct === "boolean"
          ? correct.toString().toLowerCase()
          : correct.trim().toLowerCase();
      return userAnswer === correctAnswer;
    }

    // This fallback is only needed if there are other question types not explicitly handled above
    // For now, it seems redundant, but keep it if other types might exist or if the logic flow needs it.
    // Given the current types, this block can likely be removed after testing.
    if (
      (typeof correct === "string" &&
        user.trim().toLowerCase() === correct.trim().toLowerCase()) ||
      (typeof correct === "boolean" && user === correct)
    ) {
      return true;
    }
    return false;
  };

  const calculateScore = () => {
    let correctCount = 0;
    let totalQuestions = 0;

    // Handle multiple choice questions
    if (quiz.multipleChoice) {
      quiz.multipleChoice.forEach((q, idx) => {
        totalQuestions++;
        if (isCorrect("multipleChoice", idx, q.answer, q)) {
          correctCount++;
        }
      });
    }

    // Handle fill-in-the-blank questions
    if (quiz.fillInTheBlank) {
      quiz.fillInTheBlank.forEach((q, idx) => {
        totalQuestions++;
        if (isCorrect("fillInTheBlank", idx, q.answer)) {
          correctCount++;
        }
      });
    }

    // Handle true/false questions
    if (quiz.trueFalse) {
      quiz.trueFalse.forEach((q, idx) => {
        totalQuestions++;
        if (isCorrect("trueFalse", idx, q.answer)) {
          correctCount++;
        }
      });
    }

    return totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  };

  const handleQuizCompletion = async () => {
    setIsLoading(true);
    const calculatedScore = calculateScore();
    const passed = calculatedScore >= 50; // Pass if score is 50% or more
    setScore(calculatedScore);
    setShowResults(true);

    // Call the callback function provided by the parent (StudyForm)
    onQuizCompleted(passed, quiz, userAnswers, calculatedScore);

    setIsLoading(false);
    closeModal(); // Close the modal after completion
  };

  const checkAnswers = () => {
    setShowResults(true);
    const finalScore = calculateScore();
    setScore(finalScore);
  };

  const getFeedback = (type, idx, correct, q = null) => {
    const user = userAnswers[`${type}-${idx}`];
    if (user == null || user === "")
      return <span className="text-gray-500">Skipped</span>;

    if (type === "multipleChoice" && q) {
      const selectedText = q.options[user]?.trim().toLowerCase();
      const correctText =
        typeof correct === "string" ? correct.trim().toLowerCase() : correct;

      if (isCorrect(type, idx, correct, q)) {
        return <span className="text-green-600">Correct!</span>;
      } else {
        return (
          <span className="text-red-600">
            Incorrect. Correct answer:{" "}
            {typeof correct === "string" ? correct : q.options[correct]}
          </span>
        );
      }
    }

    if (type === "fillInTheBlank") {
      const possibleAnswers =
        typeof correct === "string"
          ? correct.split(",").map((ans) => ans.trim().toLowerCase())
          : [];
      if (isCorrect(type, idx, correct)) {
        return <span className="text-green-600">Correct!</span>;
      } else {
        return (
          <span className="text-red-600">
            Incorrect. Correct answer(s): {possibleAnswers.join(", ")}. Your
            answer: {user}
          </span>
        );
      }
    }

    if (type === "trueFalse") {
      if (isCorrect(type, idx, correct)) {
        return <span className="text-green-600">Correct!</span>;
      } else {
        return (
          <span className="text-red-600">
            Incorrect. Correct answer:{" "}
            {typeof correct === "boolean"
              ? correct
                ? "True"
                : "False"
              : correct}
          </span>
        );
      }
    }

    return null;
  };

  const closeModal = () => {
    setIsVisible(false);
    setShowResults(false);
    setUserAnswers({});
    setScore(null);
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      id="my-modal"
    >
      <div
        ref={modalRef}
        className="relative top-20 mx-auto p-8 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white"
      >
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-2xl font-bold text-indigo-700">Generated Quiz</h3>
          <div className="cursor-pointer z-50" onClick={closeModal}>
            <svg
              className="h-6 w-6 text-gray-600 hover:text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        {/* True/False Questions */}
        {quiz.trueFalse && quiz.trueFalse.length > 0 && (
          <div className="mb-6 ">
            <h4 className="text-xl font-semibold text-indigo-700">
              True/False Questions
            </h4>
            <hr className="my-3 text-indigo-700" />
            {quiz.trueFalse.map((q, idx) => (
              <div
                key={`tf-${idx}`}
                className="mb-4 p-4 border rounded-md bg-gray-50"
              >
                <p className="font-medium mb-2">{q.question}</p>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  onChange={(e) =>
                    handleChange("trueFalse", idx, e.target.value)
                  }
                  value={userAnswers[`trueFalse-${idx}`] || ""}
                  disabled={showResults}
                >
                  <option hidden>Select</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
                {showResults && (
                  <p className="mt-2 text-sm">
                    {getFeedback("trueFalse", idx, q.answer)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Multiple Choice Questions */}
        {quiz.multipleChoice && quiz.multipleChoice.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-indigo-700">
              Multiple Choice Questions
            </h4>
            <hr className="my-3 text-indigo-700" />
            {quiz.multipleChoice.map((q, idx) => (
              <div
                key={`mc-${idx}`}
                className="mb-4 p-4 border rounded-md bg-gray-50"
              >
                <p className="font-medium mb-2">{q.question}</p>
                {q.options &&
                  Object.entries(q.options).map(([key, value]) => (
                    <label key={key} className="block">
                      <input
                        type="radio"
                        name={`mc-question-${idx}`}
                        value={key}
                        onChange={() =>
                          handleChange("multipleChoice", idx, key)
                        }
                        checked={userAnswers[`multipleChoice-${idx}`] === key}
                        disabled={showResults}
                        className="mr-2"
                      />
                      {value}
                    </label>
                  ))}
                {showResults && (
                  <p className="mt-2 text-sm">
                    {getFeedback("multipleChoice", idx, q.answer, q)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fill in the Blank Questions */}
        {quiz.fillInTheBlank && quiz.fillInTheBlank.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xl font-semibold text-indigo-700">
              Fill in the Blank Questions
            </h4>
            <hr className="my-3 text-indigo-700" />
            {quiz.fillInTheBlank.map((q, idx) => (
              <div
                key={`fib-${idx}`}
                className="mb-4 p-4 border rounded-md bg-gray-50"
              >
                <p className="font-medium mb-2">{q.question}</p>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1"
                  placeholder="Your answer"
                  onChange={(e) =>
                    handleChange("fillInTheBlank", idx, e.target.value)
                  }
                  value={userAnswers[`fillInTheBlank-${idx}`] || ""}
                  disabled={showResults}
                />
                {showResults && (
                  <p className="mt-2 text-sm">
                    {getFeedback("fillInTheBlank", idx, q.answer)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!showResults && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              onClick={checkAnswers}
              disabled={isLoading}
            >
              Check Answers
            </button>
          </div>
        )}

        {showResults && score !== null && (
          <div className="mt-6">
            <h4 className="text-xl font-semibold">Quiz Results:</h4>
            <p
              className={`text-2xl font-bold ${
                score >= 50 ? "text-green-600" : "text-red-600"
              }`}
            >
              Score: {score.toFixed(2)}%
            </p>
            {score >= 50 ? (
              <p className="text-green-600 font-medium">
                Congratulations! You passed.
              </p>
            ) : (
              <p className="text-red-600 font-medium">
                You did not pass. A retry session has been scheduled.
              </p>
            )}
            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                onClick={() => handleQuizCompletion()}
                disabled={isLoading}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Processing quiz results...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;
