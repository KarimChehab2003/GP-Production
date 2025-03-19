// const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const timeSlots = ["8AM-10AM", "10AM-12PM", "12PM-2PM", "2PM-4PM", "4PM-6PM", "6PM-8PM", "8PM-10PM"];


// export default function generateSchedule(collegeSchedule, externalActivities, courses) {
//     let schedule = {};
//     let Warnings = []; // Reset warnings on each function call

//     // Initializing the schedule to be empty
//     days.forEach(day => {
//         schedule[day] = {};
//         timeSlots.forEach(slot => {
//             schedule[day][slot] = "";
//         });
//     });

//     // Mapping college schedule (Lectures & Sections)
//     for (let day of days) {
//         for (let slot of timeSlots) {
//             if (collegeSchedule[day]?.[slot]) {
//                 if (schedule[day][slot] === "") {
//                     schedule[day][slot] = collegeSchedule[day][slot];
//                 } else {
//                     Warnings.push("Couldn't map college schedule due to conflict in Lecs and Sections");
//                     return { schedule: {}, Warnings };
//                 }
//             }
//         }
//     }

//     // Mapping external activities
//     for (let activity in externalActivities) {
//         let [day, preferredSlot] = externalActivities[activity];
//         if (schedule[day][preferredSlot] === "") {
//             schedule[day][preferredSlot] = activity;
//         } else {
//             let preferredIndex = timeSlots.indexOf(preferredSlot);
//             let closestIndex = -1;

//             // Find closest available slot
//             for (let i = preferredIndex - 1; i >= 0; i--) {
//                 if (schedule[day][timeSlots[i]] === "") {
//                     closestIndex = i;
//                     break;
//                 }
//             }
//             if (closestIndex === -1) {
//                 for (let i = preferredIndex + 1; i < timeSlots.length; i++) {
//                     if (schedule[day][timeSlots[i]] === "") {
//                         closestIndex = i;
//                         break;
//                     }
//                 }
//             }
//             if (closestIndex !== -1) {
//                 schedule[day][timeSlots[closestIndex]] = activity;
//                 Warnings.push(`Moved ${activity} from ${preferredSlot} ${day} to ${timeSlots[closestIndex]} ${day} due to conflict.`);
//             } else {
//                 Warnings.push(`Could not place ${activity} on ${day} (no available slots this day).`);
//             }
//         }
//     }

//     // Mapping courses
//     for (let course in courses) {
//         let [preferredSlot, sessionsRequired] = courses[course];
//         let sessionsPlaced = 0;

//         for (let day of days) {
//             if (sessionsPlaced >= sessionsRequired) break;
//             if (schedule[day][preferredSlot] === "") {
//                 schedule[day][preferredSlot] = `Study: ${course}`;
//                 sessionsPlaced++;
//             }
//         }

//         for (let day of days) {
//             if (sessionsPlaced >= sessionsRequired) break;
//             let preferredIndex = timeSlots.indexOf(preferredSlot);

//             for (let offset = 1; offset < timeSlots.length; offset++) {
//                 let before = preferredIndex - offset;
//                 let after = preferredIndex + offset;
//                 if (before >= 0 && schedule[day][timeSlots[before]] === "") {
//                     schedule[day][timeSlots[before]] = `Study: ${course}`;
//                     Warnings.push(`Moved Study: ${course} from ${preferredSlot} to ${timeSlots[before]} on ${day} due to conflicts.`);
//                     sessionsPlaced++;
//                     break;
//                 }
//                 if (after < timeSlots.length && schedule[day][timeSlots[after]] === "") {
//                     schedule[day][timeSlots[after]] = `Study: ${course}`;
//                     Warnings.push(`Moved Study: ${course} from ${preferredSlot} to ${timeSlots[after]} on ${day} due to conflicts.`);
//                     sessionsPlaced++;
//                     break;
//                 }
//             }
//         }

//         if (sessionsPlaced < sessionsRequired) {
//             Warnings.push(`Could not place all ${sessionsRequired} sessions for ${course}. Only ${sessionsPlaced} placed.`);
//         }
//     }

//     return { schedule, Warnings };
// }


const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["8AM-10AM", "10AM-12PM", "12PM-2PM", "2PM-4PM", "4PM-6PM", "6PM-8PM", "8PM-10PM"];

export default function generateSchedule(collegeSchedule, externalActivities, courses) {
    let conflicts = [];
    let schedule = {};
    
    // Initialize schedule
    days.forEach(day => {
        schedule[day] = {};
        timeSlots.forEach(slot => {
            schedule[day][slot] = "";
        });
    });

    // Place college schedule
    days.forEach(day => {
        let last = "";
        timeSlots.forEach(slot => {
            if (collegeSchedule[day] && collegeSchedule[day][slot]) {
                if (schedule[day][slot] === "") {
                    schedule[day][slot] = collegeSchedule[day][slot];
                    last = slot;
                } else {
                    conflicts.push("Couldn't map college schedule due to conflict in lectures and sections");
                    return {};
                }
            }
        });

        if (last) {
            let lastIndex = timeSlots.indexOf(last);
            if (lastIndex + 1 < timeSlots.length && schedule[day][timeSlots[lastIndex + 1]] === "") {
                schedule[day][timeSlots[lastIndex + 1]] = "Break";
            }
        }
    });

    // // Place external activities
    for (let [activity, [day, preferredSlot, location]] of Object.entries(externalActivities)) {
        if (schedule[day] && schedule[day][preferredSlot] === "") {
            schedule[day][preferredSlot] = activity;
            if (location === "Outdoor") {
                let index = timeSlots.indexOf(preferredSlot);
                if (index + 1 < timeSlots.length && schedule[day][timeSlots[index + 1]] === "") {
                    schedule[day][timeSlots[index + 1]] = "Break";
                }
            }
        } else {
            conflicts.push(`Could not place ${activity} on ${day} due to conflict.`);
        }
    }

    // // Place courses
    for (const [courseName, [preferredSlot, sessionsRequired]] of Object.entries(courses)) {
        let sessionsPlaced = 0;

        // Step 0: Calculate emptySlotsPerDay
        let emptySlotsPerDay = Array(7).fill(0);
        days.forEach((day, dayIndex) => {
            timeSlots.forEach(slot => {
                if (schedule[day][slot] === "") {
                    emptySlotsPerDay[dayIndex]++;
                }
            });
        });

        // Step 1: Try placing in the preferred timeslot on the emptiest day
        for (let i = 0; i < 7; i++) {
            if (sessionsPlaced >= sessionsRequired) break;

            let idxMax = emptySlotsPerDay.indexOf(Math.max(...emptySlotsPerDay));
            let emptiestDay = days[idxMax];

            if (schedule[emptiestDay][preferredSlot] === "") {
                schedule[emptiestDay][preferredSlot] = `Study: ${courseName}`;
                sessionsPlaced++;
            }
            emptySlotsPerDay[idxMax] = 0; // Mark this day as processed
        }

        // Step 2: Handle conflicts by finding the nearest available timeslot
        emptySlotsPerDay.fill(0); // Recalculate empty slots per day
        days.forEach((day, dayIndex) => {
            timeSlots.forEach(slot => {
                if (schedule[day][slot] === "") {
                    emptySlotsPerDay[dayIndex]++;
                }
            });
        });

        for (let i = 0; i < 7; i++) {
            if (sessionsPlaced >= sessionsRequired) break;

            let idxMax = emptySlotsPerDay.indexOf(Math.max(...emptySlotsPerDay));
            let emptiestDay = days[idxMax];

            let preferredIndex = timeSlots.indexOf(preferredSlot);
            if (preferredIndex !== -1) {
                let closestIndex = -1;

                // Check before and after the preferred slot with an offset of 2
                for (let offset = 2; offset < timeSlots.length; offset++) {
                    let before = preferredIndex - offset;
                    let after = preferredIndex + offset;

                    if (before >= 0 && schedule[emptiestDay][timeSlots[before]] === "") {
                        closestIndex = before;
                    } else if (after < timeSlots.length && schedule[emptiestDay][timeSlots[after]] === "") {
                        closestIndex = after;
                    }

                    if (closestIndex !== -1) {
                        schedule[emptiestDay][timeSlots[closestIndex]] = `Study: ${courseName}`;
                        emptySlotsPerDay[idxMax] = 0;
                        conflicts.push(`Moved Study: ${courseName} from ${preferredSlot} to ${timeSlots[closestIndex]} on ${emptiestDay} due to conflicts.`);
                        sessionsPlaced++;
                        break;
                    }
                }
            } else {
                conflicts.push(`Couldn't Map Study Sessions for ${courseName} due to an invalid time slot.`);
            }
        }

        // Step 3: If sessions couldn't be placed, generate a warning
        if (sessionsPlaced < sessionsRequired) {
            conflicts.push(`Could not place all ${sessionsRequired} sessions for ${courseName}. Only ${sessionsPlaced} placed.`);
        }
    }

    return { schedule, conflicts };
}