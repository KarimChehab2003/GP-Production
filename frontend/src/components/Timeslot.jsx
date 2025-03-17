function Timeslot({ content, type }) {
    const getClassNames = () => {
        switch (type) {
            case "day":
                return "text-2xl text-indigo-500 font-semibold uppercase";
            case "timeslot":
                return "text-lg text-gray-700";
            case "slot":
                return "text-base text-center text-black";
            case "default":
            default:
                return "";
        }
    };

    const isNonClickable = type !== "slot"

    return (
        <div className={`flex justify-center items-center p-4 border border-indigo-200 ${isNonClickable ? 'pointer-events-none' : 'cursor-pointer'}`}>
            <p className={getClassNames()}>{content}</p>
        </div>
    );
}

export default Timeslot;