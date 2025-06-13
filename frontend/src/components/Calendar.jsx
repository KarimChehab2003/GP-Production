import Slot from "./Slot";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

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

  // State to hold the calendar data
  const [calendarData, setCalendarData] = useState([]);

  // Function to create the calendar data
  const createCalendar = () => {
    const initialCalendar = Array.from({ length: 8 }, () =>
      new Array(8).fill("")
    );
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (i === 0 && j === 0) continue;
        if (i === 0) initialCalendar[i][j] = days[j - 1];
        if (j === 0) initialCalendar[i][j] = timeslots[i - 1];
      }
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const collegeSchedule = currentUser?.timetable?.schedule;

    if (collegeSchedule) {
      Object.entries(collegeSchedule).forEach(([day, schedule]) => {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return;
        Object.entries(schedule).forEach(([time, subject]) => {
          const timeIndex = timeslots.indexOf(time);
          if (timeIndex !== -1) {
            initialCalendar[timeIndex + 1][dayIndex + 1] = subject;
          }
        });
      });
    }
    return initialCalendar;
  };

  // Effect to update calendar data when setTaskList or currentUser in localStorage changes
  useEffect(() => {
    setCalendarData(createCalendar());
  }, [setTaskList]); // Depend on setTaskList, which should trigger when relevant data changes

  const handleRemoveQuizSession = useCallback(
    async (day, time, subject, lectureNumber) => {
      try {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (
          !currentUser ||
          !currentUser.timetable ||
          !currentUser.timetable.schedule
        ) {
          console.error("Current user or timetable not found.");
          return;
        }

        const updatedSchedule = { ...currentUser.timetable.schedule };
        if (updatedSchedule[day] && updatedSchedule[day][time]) {
          updatedSchedule[day][time] = ""; // Remove the session from the schedule
        }

        // Update local storage
        localStorage.setItem(
          "currentUser",
          JSON.stringify({
            ...currentUser,
            timetable: { schedule: updatedSchedule },
          })
        );

        // Update database
        await axios.put("http://localhost:5100/api/quiz/update-user", {
          userId: currentUser.id,
          timetable: { schedule: updatedSchedule },
        });

        // Update calendar data to reflect removal
        setCalendarData(createCalendar());
        alert(
          `Quiz session for ${subject} on lecture ${lectureNumber} removed successfully!`
        );
      } catch (error) {
        console.error("Error removing quiz session:", error);
        alert("Failed to remove quiz session.");
      }
    },
    []
  );

  const currentDayName = days[new Date().getDay()];

  return (
    <div className="grid grid-cols-8">
      {calendarData.map((row, i) =>
        row.map((col, j) => {
          let slotType = "default";
          let isCurrentDay = false;
          let sessionCategory = "empty";
          let modalEventType = "";
          let modalSubject = "";
          let modalLectureNumber = null;
          let modalDay = days[j - 1]; // Current day for the slot
          let modalTime = timeslots[i - 1]; // Current timeslot for the slot

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
            isCurrentDay = calendarData[0][j] === currentDayName; // Check if current day for the column

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
              sessionCategory = "failedQuiz";
              modalEventType = "retryQuiz";
              const match = content.match(
                /Quiz session for (.+) on lecture (\d+)/
              );
              if (match) {
                modalSubject = match[1];
                modalLectureNumber = parseInt(match[2]);
              }
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
                modalSubject={modalSubject}
                modalLectureNumber={modalLectureNumber}
                modalDay={modalDay}
                modalTime={modalTime}
                onRemoveQuizSession={handleRemoveQuizSession} // Pass the callback
              />
            );
          }
        })
      )}
    </div>
  );
}

export default Calendar;
