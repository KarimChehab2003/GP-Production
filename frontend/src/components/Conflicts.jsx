import { FaExclamationTriangle } from "react-icons/fa";

function Conflicts({ conflicts }) {
    if (!conflicts || conflicts.length === 0) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-600 text-lg">Your Generated Schedule has no conflicts</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Schedule Conflicts</h2>
                <p className="text-gray-600">The following conflicts were detected in your schedule:</p>
            </div>
            
            <div className="space-y-4">
                {conflicts.map((conflict, index) => (
                    <div 
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                        <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                        <p className="text-gray-700">{conflict}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Conflicts;