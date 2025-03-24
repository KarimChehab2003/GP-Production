import { useState } from "react";
import SlotModal from "./SlotModal";

function Timeslot({ content, type }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isDisabled = type !== "slot";

    const getClassNames = () => {
        switch (type) {
            case "day":
                return "text-2xl text-indigo-500 font-semibold uppercase";
            case "timeslot":
                return "text-lg text-gray-500";
            case "slot":
                return "text-base text-center text-black";
            case "default":
            default:
                return "";
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleClick = () => {
        if (type !== "slot") return;
        setIsModalOpen(true);
    };

    const [eventType, eventContent] = content.split(":");

    return (
        <div
            className={`flex justify-center items-center p-4 border border-indigo-200 ${isDisabled ? 'pointer-events-none' : 'cursor-pointer hover:bg-gray-200 transition duration-300 '}`}
            onClick={handleClick}
        >
            <p className={getClassNames()}>{content}</p>

            {isModalOpen && (
                <SlotModal
                    onClose={handleCloseModal}
                    type={eventType}
                    subject={eventContent}
                />
            )}
        </div>
    );
}

export default Timeslot;
