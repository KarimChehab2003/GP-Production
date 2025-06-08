import Slot from "./Slot";
import { useState } from "react";

function Calendar({ setTaskList }) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
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

    const collegeSchedule = JSON.parse(localStorage.getItem("currentUser"))
      .timetable?.schedule;
    if (collegeSchedule) {
      Object.entries(collegeSchedule).forEach(([day, schedule]) => {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return;
        Object.entries(schedule).forEach(([time, subject]) => {
          const timeIndex = timeslots.indexOf(time);
          if (timeIndex !== -1) {
            calendar[timeIndex + 1][dayIndex + 1] = subject;
          }
        });
      });
    }

    return calendar;
  };

  const calendar = createCalendar();
  const currentDayName = days[new Date().getDay()];

  return (
    <div className="grid grid-cols-8">
      {calendar.map((row, i) =>
        row.map((col, j) => {
          let slotType = "default";
          let isCurrentDay = false;
          let sessionCategory = "empty";
          let modalEventType = "";

          if (i === 0 && j === 0) {
            // Top-left empty corner
            return <Slot key={`${i}-${j}`} content={col} type={slotType} />;
          } else if (i === 0) {
            // Day headers
            slotType = "day";
            isCurrentDay = col === currentDayName;
            return (
              <Slot
                key={`${i}-${j}`}
                content={col}
                type={slotType}
                isCurrentDay={isCurrentDay}
              />
            );
          } else if (j === 0) {
            // Time slot headers
            slotType = "timeslot";
            return <Slot key={`${i}-${j}`} content={col} type={slotType} />;
          } else {
            // Schedule slots
            slotType = "slot";
            isCurrentDay = calendar[0][j] === currentDayName; // Check if current day for the column

            const content = col;
            if (content.startsWith("Study:")) {
              sessionCategory = "study";
              modalEventType = "Study";
            } else if (content.startsWith("Lec:")) {
              sessionCategory = "lecture";
              modalEventType = "Lec";
            } else if (content.startsWith("Sec:")) {
              sessionCategory = "section";
              modalEventType = "Sec";
            } else if (content === "Break") {
              sessionCategory = "break";
              modalEventType = "";
            } else if (content.startsWith("Quiz session for")) {
              sessionCategory = "quizRetry";
              modalEventType = "";
            } else {
              sessionCategory = "empty";
              modalEventType = "";
            }
            return (
              <Slot
                key={`${i}-${j}`}
                content={col}
                type={slotType}
                isCurrentDay={isCurrentDay}
                sessionCategory={sessionCategory}
                setTaskList={setTaskList}
                modalEventType={modalEventType}
                modalSubject={col}
              />
            );
          }
        })
      )}
    </div>
  );
}

export default Calendar;
