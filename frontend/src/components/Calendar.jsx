import Slot from "./Slot";
import { useState } from "react";

function Calendar() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeslots = [
        "8AM-10AM",
        "10AM-12PM",
        "12PM-2PM",
        "2PM-4PM",
        "4PM-6PM",
        "6PM-8PM",
        "8PM-10PM",
    ];

    const createCalendar = () => {
        /*
            [0,0] -> empty
            [0,n] -> days
            [n,0] -> timeslots
            rest -> slots
        */

        const calendar = Array.from({ length: 8 }, () => new Array(8).fill(""));
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (i == 0 && j == 0) continue;
                if (i == 0) calendar[i][j] = days[j - 1];
                if (j == 0) calendar[i][j] = timeslots[i - 1];
            }
        }

        const collegeSchedule = JSON.parse(localStorage.getItem("currentUser")).timetable?.schedule;
        if (collegeSchedule) {
            Object.entries(collegeSchedule).forEach(([day, schedule]) => {
                const dayIndex = days.indexOf(day);
                if (dayIndex === -1) return;
                Object.entries(schedule).forEach(([time, subject]) => {
                    const timeIndex = timeslots.indexOf(time);
                    if (timeIndex !== -1) {
                        calendar[timeIndex + 1][dayIndex + 1] = subject;
                    }

                })
            })
        }

        return calendar
    };

    const calendar = createCalendar();
    // console.log("Calendar:", calendar);
    // console.log("College Schedule:", collegeSchedule);
    // console.log("Updated Calendar:", calendar);

    return <div className="grid grid-cols-8">
        {
            calendar.map((row, i) =>
                row.map((col, j) => {
                    if (i == 0 && j == 0) return <Slot key={`${i}-${j}`} content={col} type={"default"} />
                    if (i == 0) return <Slot key={`${i}-${j}`} content={col} type={"day"} />
                    if (j == 0) return <Slot key={`${i}-${j}`} content={col} type={"timeslot"} />
                    return <Slot key={`${i}-${j}`} content={col} type={"slot"} />
                })
            )
        }
    </div>;
}

export default Calendar;
