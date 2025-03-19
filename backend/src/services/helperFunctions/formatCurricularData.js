export default function formatCurricularData(extracurricularActivities) {
    let activitySchedule = {}
    extracurricularActivities.forEach(entry => {
        let { day, name, time, place } = entry;

        if (!activitySchedule[name]) {
            activitySchedule[name] = [day, time, place];
        }
    });

    return activitySchedule;
}

// Example usage:
// let data = {
//     extracurricularActivities: [
//         { day: "Friday", name: "Gym", time: "10AM-12PM", place: "Outdoor" },
//         { day: "Saturday", name: "Club", time: "8AM-10AM", place: "Indoor" }
//     ]
// };

// let formattedData = formatCurricularData(data.extracurricularActivities);
// console.log(formattedData);
