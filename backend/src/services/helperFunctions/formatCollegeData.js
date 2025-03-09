export default function formatCollegeData(course) {
    let collegeSchedule = {};

    course.LecturesAndSectionsTimeslots.forEach(entry => {
        let { day, timeslot, type } = entry;
        let formattedType = type === "Lecture" ? "Lec" : "Sec"; // Convert type to match sample
        let courseName = course.courseName; // Replace with actual course name if available

        if (!collegeSchedule[day]) {
            collegeSchedule[day] = {};
        }

        collegeSchedule[day][timeslot] = `${formattedType}: ${courseName}`;
    });

    return collegeSchedule;
}

// Example usage:
// let course = {
//     courseName: "QA",
//     LecturesAndSectionsTimeslots: [
//         { day: "Monday", timeslot: "10AM-12PM", type: "Lecture" },
//         { day: "Wednesday", timeslot: "8AM-10AM", type: "Section" }
//     ]
// };

// let formattedData = formatFirestoreData(course);
// console.log(formattedData);
