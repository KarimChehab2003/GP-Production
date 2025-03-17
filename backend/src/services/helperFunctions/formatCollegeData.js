export default function formatCollegeData(courses) {
    let collegeSchedule = {};

    courses.map((course) => {
        course.timeSlots.forEach(entry => {
            let { day, timeslot, type } = entry;
            let formattedType = type === "Lecture" ? "Lec" : "Sec"; // Convert type to match sample
            let courseName = course.courseName; // Replace with actual course name if available

            if (!collegeSchedule[day]) {
                collegeSchedule[day] = {};
            }

            collegeSchedule[day][timeslot] = `${formattedType}: ${courseName}`;
        });
    })

    return collegeSchedule;
}

// Example usage:
// let courses = [
//     {
//         courseName: "QA",
//         LecturesAndSectionsTimeslots: [
//             { day: "Sunday", timeslot: "10AM-12PM", type: "Lecture" },
//             { day: "Sunday", timeslot: "8AM-10AM", type: "Section" }
//         ]
//     },
//     {
//         courseName: "UID",
//         LecturesAndSectionsTimeslots: [
//             { day: "Sunday", timeslot: "12PM-2PM", type: "Lecture" },
//             { day: "Sunday", timeslot: "2PM-4PM", type: "Section" }
//         ]
//     }
// ]

// let formattedData = formatCollegeData(courses);
// console.log(formattedData);
