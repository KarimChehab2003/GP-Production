export default function formatCurricularData(data) {
    let activitySchedule = {}
    data.extracurricularActivities.forEach(entry => {
        let { day, name, time } = entry;

        if (!activitySchedule[name]) {
            activitySchedule[name] = [day, time];
        }
    });

    return activitySchedule;
}

// Example usage:
// let data = {
//     extracurricularActivities: [
//         { day: "Friday", name: "Gym", time: "10AM-12PM" },
//         { day: "Saturday", name: "Club", time: "8AM-10AM" }
//     ]
// };

// let formattedData = formatFirestoreData(course);
// console.log(formattedData);
