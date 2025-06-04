import { useState, useRef } from "react";

function Quiz({ quiz }) {
  const [isVisible, setIsVisible] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);
  const modalRef = useRef(null);

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
      const correctKey = q.answer?.replace(/[^A-D]/gi, "");
      if (user === correctKey) return true;
      if (
        q.options &&
        q.options[user] &&
        q.options[user].trim().toLowerCase() === q.answer?.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    }

    if (type === "fillInTheBlank") {
      if (typeof correct === "string") {
        const possibleAnswers = correct
          .split(",")
          .map((ans) => ans.trim().toLowerCase());
        return possibleAnswers.includes(user.trim().toLowerCase());
      }
    }

    if (
      (typeof correct === "string" &&
        user.trim().toLowerCase() === correct.trim().toLowerCase()) ||
      (typeof correct === "boolean" && user === correct)
    ) {
      return true;
    }
    return false;
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    setShowResults(true);
    let total = 0;
    let correctCount = 0;

    // True/False
    quiz.trueFalse.forEach((q, i) => {
      total++;
      if (isCorrect("trueFalse", i, q.answer)) correctCount++;
    });

    // Multiple Choice
    quiz.multipleChoice.forEach((q, i) => {
      total++;
      const correct = q.answer?.replace(/[^A-D]/gi, "");
      if (isCorrect("multipleChoice", i, correct, q)) correctCount++;
    });

    // Fill in the Blank
    quiz.fillInTheBlank.forEach((q, i) => {
      total++;
      if (isCorrect("fillInTheBlank", i, q.answer)) correctCount++;
    });

    setScore({ correct: correctCount, total });

    // Scroll to top of modal
    if (modalRef.current) {
      modalRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getFeedback = (type, idx, correct, q = null) => {
    if (!showResults) return null;
    const user = userAnswers[`${type}-${idx}`];
    if (user == null || user === "")
      return <span className="text-yellow-600 ml-2">No answer</span>;
    if (isCorrect(type, idx, correct, q)) {
      return <span className="text-green-600 ml-2 font-semibold">Correct</span>;
    }
    return <span className="text-red-600 ml-2 font-semibold">Incorrect</span>;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/10">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative overflow-y-auto border border-gray-200"
        style={{ maxHeight: "90vh" }}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={() => setIsVisible(false)}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="font-bold text-2xl mb-2 text-center text-indigo-700">
          Generated Quiz
        </h3>
        {score && (
          <div className="mb-4 text-xl font-bold text-center text-indigo-600 bg-indigo-50 rounded p-2 shadow">
            Your Score: {score.correct} / {score.total}
          </div>
        )}
        <div className="space-y-8">
          {/* True/False */}
          {quiz.trueFalse.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                True/False Questions
              </h4>
              <ul className="space-y-4">
                {quiz.trueFalse.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <select
                      className="border rounded p-1"
                      value={userAnswers[`trueFalse-${i}`] || ""}
                      onChange={(e) =>
                        handleChange("trueFalse", i, e.target.value)
                      }
                    >
                      <option value="" hidden>
                        Select
                      </option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                    {getFeedback("trueFalse", i, q.answer)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Multiple Choice */}
          {quiz.multipleChoice.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                Multiple Choice Questions
              </h4>
              <ul className="space-y-4">
                {quiz.multipleChoice.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <ul>
                      {q.options &&
                        Object.entries(q.options).map(([key, value], idx) => (
                          <li key={key} className="mb-1">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`multipleChoice-${i}`}
                                value={key}
                                checked={
                                  userAnswers[`multipleChoice-${i}`] === key
                                }
                                onChange={() =>
                                  handleChange("multipleChoice", i, key)
                                }
                                className="mr-2"
                              />
                              {value}
                            </label>
                          </li>
                        ))}
                    </ul>
                    {getFeedback(
                      "multipleChoice",
                      i,
                      q.answer?.replace(/[^A-D]/gi, ""),
                      q
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fill in the Blank */}
          {quiz.fillInTheBlank.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3 text-indigo-800 border-b pb-1">
                Fill in the Blank Questions
              </h4>
              <ul className="space-y-4">
                {quiz.fillInTheBlank.map((q, i) => (
                  <li key={i} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="mb-2 font-medium">{q.question}</div>
                    <input
                      type="text"
                      className="border rounded p-1"
                      value={userAnswers[`fillInTheBlank-${i}`] || ""}
                      onChange={(e) =>
                        handleChange("fillInTheBlank", i, e.target.value)
                      }
                    />
                    {getFeedback("fillInTheBlank", i, q.answer)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          className="mt-8 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 font-bold text-lg shadow"
          onClick={checkAnswers}
        >
          Check Answers
        </button>
        {showResults && (
          <button
            className="mt-4 w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition duration-300 font-bold text-lg shadow"
            onClick={() => setIsVisible(false)}
          >
            Close Quiz
          </button>
        )}
      </div>
    </div>
  );
}

export default Quiz;
