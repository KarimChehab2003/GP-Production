import React, { useState, useCallback } from "react";
import axios from "axios";
import Quiz from "./Quiz";
import { useTasks } from "../contexts/TasksContext";

function RetryQuizForm({
  subject,
  lectureNumber,
  onCloseModal,
  modalDay,
  modalTime,
  onRemoveQuizSession,
}) {
  const { setTasks } = useTasks();
  const [file, setFile] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [quizError, setQuizError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setGeneratedQuiz(null); // Clear previous quiz when a new file is selected
    setQuizError(null);
  };

  const handleUploadClick = useCallback(async () => {
    if (!file) {
      setQuizError("Please select a file first.");
      return;
    }

    setIsLoadingFile(true);
    setQuizError(null);

    const formData = new FormData();
    formData.append("lecture", file);

    try {
      const response = await axios.post(
        "http://localhost:5100/api/quiz/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setGeneratedQuiz(response.data);
    } catch (err) {
      setQuizError(err.response?.data?.error || "Failed to generate quiz.");
      console.error("Error generating quiz:", err);
    } finally {
      setIsLoadingFile(false);
    }
  }, [file]);

  const handleQuizCompletion = (
    passed,
    quizData,
    userAnswers,
    calculatedScore
  ) => {
    console.log("Quiz completed. Passed:", passed, "Score:", calculatedScore);

    // 1. Record the quiz outcome in tasks context
    setTasks((prevTasks) => [
      ...prevTasks,
      {
        type: "quiz-outcome",
        subject: subject,
        lectureNumber: lectureNumber,
        status: passed ? "passed" : "failed",
        score: calculatedScore, // Store the score for trends
        timestamp: Date.now(),
      },
    ]);

    // 2. Remove the temporary session from the calendar and update the database
    if (modalDay && modalTime && subject && lectureNumber) {
      onRemoveQuizSession(modalDay, modalTime, subject, lectureNumber);
    }
    onCloseModal(); // Close the modal after completion
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-3">
        Retry Quiz for: {subject} - Lecture {lectureNumber}
      </h3>

      {quizError && <p className="text-red-500 text-xs mt-2">{quizError}</p>}

      {!generatedQuiz ? (
        <div className="mt-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="retry-file-upload"
          >
            Upload lecture material (pptx or pdf)
          </label>
          <input
            type="file"
            id="retry-file-upload"
            accept=".pptx,.pdf"
            onChange={handleFileChange}
            className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
          />
          <button
            onClick={handleUploadClick}
            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoadingFile}
          >
            {isLoadingFile ? "Generating quiz..." : "Generate Quiz"}
          </button>
          {isLoadingFile && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-1 text-gray-600">Generating quiz...</p>
            </div>
          )}
        </div>
      ) : (
        <Quiz quiz={generatedQuiz} onQuizCompleted={handleQuizCompletion} />
      )}
    </div>
  );
}

export default RetryQuizForm;
