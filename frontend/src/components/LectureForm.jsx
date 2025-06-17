import { useState, useEffect, useCallback } from "react";
import Quiz from "./Quiz";
import axios from "axios";
import React from "react";

const LectureForm = React.memo(function LectureForm({
  index,
  lectureNumber,
  onLectureChange,
  sessionNumber,
  onQuizCompleted,
}) {
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

  return (
    <div className="border p-4 mb-4 rounded-md shadow-sm">
      <h4 className="text-lg font-semibold mb-3">Lecture {index + 1}</h4>

      <div className="mb-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor={`lecture-number-${index}`}
        >
          Lecture number:
        </label>
        <input
          type="number"
          id={`lecture-number-${index}`}
          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
          placeholder="Enter lecture number"
          value={lectureNumber || ""} // Use lectureNumber prop
          onChange={(e) =>
            onLectureChange(index, "number", parseInt(e.target.value))
          }
        />
      </div>

      <div className="mt-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor={`file-${index}`}
        >
          Upload lecture material (pptx or pdf)
        </label>
        <input
          type="file"
          id={`file-${index}`}
          accept=".pptx,.pdf"
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
        />
        <button
          onClick={handleUploadClick}
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 cursor-pointer"
          disabled={isLoadingFile}
        >
          {isLoadingFile ? "Generating quiz..." : "Generate Quiz"}
        </button>
        {quizError && <p className="text-red-500 text-xs mt-2">{quizError}</p>}
        {isLoadingFile && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-1 text-gray-600">Generating quiz...</p>
          </div>
        )}
      </div>

      {generatedQuiz && (
        <Quiz
          quiz={generatedQuiz}
          onQuizCompleted={(passed, quizData, userAnswers, calculatedScore) =>
            onQuizCompleted(
              passed,
              quizData,
              userAnswers,
              calculatedScore,
              lectureNumber // Pass lectureNumber from LectureForm's props
            )
          }
        />
      )}
    </div>
  );
});

export default LectureForm;
