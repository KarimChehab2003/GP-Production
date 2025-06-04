import { useState, useEffect } from "react";
import Quiz from "./Quiz";
import axios from "axios";

function StudyForm({ eventType, subject, setFormDetails }) {
  const [lectureCount, setLectureCount] = useState(1);
  const [lectureDetails, setLectureDetails] = useState([]);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLectureChange = (index, field, value) => {
    setLectureDetails((prevDetails) => {
      const updatedDetails = [...prevDetails];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
      };
      return updatedDetails;
    });
  };

  const handleFileUpload = async (file, index) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("lecture", file);

    try {
      const response = await axios.post(
        "http://localhost:5100/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setGeneratedQuiz((prev) => ({
        ...prev,
        [index]: response.data,
      }));

      console.log("response:", response.data);

      // Update lecture details with the quiz
      handleLectureChange(index, "quiz", response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate quiz");
      console.error("Error generating quiz:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFormDetails((prevDetails) => ({
      ...prevDetails,
      lectureDetails,
    }));
  }, [lectureDetails, setFormDetails]);

  return (
    <div className="bg-white max-h-[80vh] overflow-y-auto rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-4">{eventType.toUpperCase()}</h2>
      {subject && <p className="mb-4">Subject: {subject}</p>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {[...Array(lectureCount)].map((_, index) => (
        <LectureForm
          key={index}
          index={index}
          onLectureChange={handleLectureChange}
          onFileUpload={handleFileUpload}
          generatedQuiz={generatedQuiz?.[index]}
          isLoading={isLoading}
        />
      ))}

      <div className="flex justify-between space-x-4 mt-6">
        <button
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-300"
          onClick={() => setLectureCount((prev) => prev + 1)}
        >
          Add Lecture
        </button>
        {lectureCount > 1 && (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
            onClick={() => setLectureCount((prev) => prev - 1)}
          >
            Remove Last Lecture
          </button>
        )}
      </div>
    </div>
  );
}

function LectureForm({
  index,
  onLectureChange,
  onFileUpload,
  generatedQuiz,
  isLoading,
}) {
  return (
    <div className="flex flex-col space-y-4 mb-4 border border-gray-200 rounded-lg p-4">
      <div>
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
          onChange={(e) => onLectureChange(index, "number", e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label
          className="block text-gray-700 font-medium mb-2"
          htmlFor={`status-${index}`}
        >
          Did you finish studying this lecture?
        </label>
        <select
          id={`status-${index}`}
          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
          onChange={(e) => onLectureChange(index, "status", e.target.value)}
        >
          <option hidden>Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
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
          accept=".ppt,.pptx,.pdf"
          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
          onChange={(e) => {
            onLectureChange(index, "file", e.target.files[0]);
            onFileUpload(e.target.files[0], index);
          }}
        />
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Generating quiz...</p>
        </div>
      )}

      {generatedQuiz && <Quiz quiz={generatedQuiz} />}
    </div>
  );
}

export default StudyForm;
