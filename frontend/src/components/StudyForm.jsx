import { useState, useEffect } from "react";

function StudyForm({ eventType, subject, setFormDetails }) {
    const [lectureCount, setLectureCount] = useState(1);
    const [lectureDetails, setLectureDetails] = useState([]);

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

            {[...Array(lectureCount)].map((_, index) => (
                <LectureForm
                    key={index}
                    index={index}
                    onLectureChange={handleLectureChange}
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

function LectureForm({ index, onLectureChange }) {
    return (
        <div className="flex flex-col space-y-4 mb-4 border border-gray-200 rounded-lg p-4">
            <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor={`lecture-number-${index}`}>Lecture number:</label>
                <input
                    type="number"
                    id={`lecture-number-${index}`}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
                    placeholder="Enter lecture number"
                    onChange={(e) => onLectureChange(index, 'number', e.target.value)}
                />
            </div>

            <div className="mt-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor={`status-${index}`}>Did you finish studying this lecture?</label>
                <select
                    id={`status-${index}`}
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
                    onChange={(e) => onLectureChange(index, 'status', e.target.value)}
                >
                    <option hidden>Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>

            <div className="mt-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor={`file-${index}`}>Upload lecture material (pptx or pdf)</label>
                <input
                    type="file"
                    id={`file-${index}`}
                    accept=".ppt,.pptx,.pdf"
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
                    onChange={(e) => onLectureChange(index, 'file', e.target.files[0])}
                />
            </div>
        </div>
    );
}

export default StudyForm;
