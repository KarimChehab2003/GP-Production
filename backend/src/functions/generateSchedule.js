const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["8AM-10AM", "10AM-12PM", "12PM-2PM", "2PM-4PM", "4PM-6PM", "6PM-8PM", "8PM-10PM"];
let Warnings = [];

export default function generateSchedule(collegeSchedule, externalActivities, courses) {
    let schedule = {};

    // Initializing the schedule to be empty
    days.forEach(day => {
        schedule[day] = {};
        timeSlots.forEach(slot => {
            schedule[day][slot] = "-";
        });
    });

    // Mapping college schedule (Lectures & Sections)
    for (let day of days) {
        for (let slot of timeSlots) {
            if (collegeSchedule[day]?.[slot]) {
                if (schedule[day][slot] === "-") {
                    schedule[day][slot] = collegeSchedule[day][slot];
                } else {
                    Warnings.push("Couldn't map college schedule due to conflict in Lecs and Sections");
                    return {};
                }
            }
        }
    }

    // Mapping external activities
    for (let activity in externalActivities) {
        let [day, preferredSlot] = externalActivities[activity];
        if (schedule[day][preferredSlot] === "-") {
            schedule[day][preferredSlot] = activity;
        } else {
            let preferredIndex = timeSlots.indexOf(preferredSlot);
            let closestIndex = -1;

            // Find closest available slot
            for (let i = preferredIndex - 1; i >= 0; i--) {
                if (schedule[day][timeSlots[i]] === "-") {
                    closestIndex = i;
                    break;
                }
            }
            if (closestIndex === -1) {
                for (let i = preferredIndex + 1; i < timeSlots.length; i++) {
                    if (schedule[day][timeSlots[i]] === "-") {
                        closestIndex = i;
                        break;
                    }
                }
            }
            if (closestIndex !== -1) {
                schedule[day][timeSlots[closestIndex]] = activity;
                Warnings.push(`Moved ${activity} from ${preferredSlot} ${day} to ${timeSlots[closestIndex]} ${day} due to conflict.`);
            } else {
                Warnings.push(`Could not place ${activity} on ${day} (no available slots this day).`);
            }
        }
    }

    // Mapping courses
    for (let course in courses) {
        let [preferredSlot, sessionsRequired] = courses[course];
        let sessionsPlaced = 0;

        for (let day of days) {
            if (sessionsPlaced >= sessionsRequired) break;
            if (schedule[day][preferredSlot] === "-") {
                schedule[day][preferredSlot] = `Study: ${course}`;
                sessionsPlaced++;
            }
        }

        for (let day of days) {
            if (sessionsPlaced >= sessionsRequired) break;
            let preferredIndex = timeSlots.indexOf(preferredSlot);

            for (let offset = 1; offset < timeSlots.length; offset++) {
                let before = preferredIndex - offset;
                let after = preferredIndex + offset;
                if (before >= 0 && schedule[day][timeSlots[before]] === "-") {
                    schedule[day][timeSlots[before]] = `Study: ${course}`;
                    Warnings.push(`Moved Study: ${course} from ${preferredSlot} to ${timeSlots[before]} on ${day} due to conflicts.`);
                    sessionsPlaced++;
                    break;
                }
                if (after < timeSlots.length && schedule[day][timeSlots[after]] === "-") {
                    schedule[day][timeSlots[after]] = `Study: ${course}`;
                    Warnings.push(`Moved Study: ${course} from ${preferredSlot} to ${timeSlots[after]} on ${day} due to conflicts.`);
                    sessionsPlaced++;
                    break;
                }
            }
        }

        if (sessionsPlaced < sessionsRequired) {
            Warnings.push(`Could not place all ${sessionsRequired} sessions for ${course}. Only ${sessionsPlaced} placed.`);
        }
    }
    console.log(schedule)
    return schedule;
}


