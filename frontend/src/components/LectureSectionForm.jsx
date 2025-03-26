function LectureSectionForm({ eventType, subject, setFormDetails }) {
    return (
        <>
            <h2 className="text-2xl font-semibold mb-4">{eventType.toUpperCase()}</h2>
            {subject && <p className="mb-4">Subject: {subject}</p>}
            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="number">
                    Which {eventType} number was conducted today?
                </label>
                <input
                    type="number"
                    id="number"
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
                    placeholder={`Enter ${eventType} number`}
                    onChange={(e) => setFormDetails((prevState) => ({ ...prevState, number: eventType + " " + e.target.value }))}

                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="status">
                    Was the {eventType} fully explained or partially done?
                </label>
                <select
                    id="status"
                    className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-indigo-500 transition duration-300"
                    onChange={(e) => setFormDetails((prevState) => ({ ...prevState, status: e.target.value }))}
                >
                    <option hidden>Select</option>
                    <option value="fully">Fully Explained</option>
                    <option value="partially">Partially Done</option>
                </select>
            </div>

        </>
    );
}

export default LectureSectionForm;