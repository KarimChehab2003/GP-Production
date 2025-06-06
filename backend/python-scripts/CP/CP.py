#To Install requirements: "python -m pip install -r python-scripts/CP/requirements.txt" In terminal
from ortools.sat.python import cp_model
import pandas as pd
import json
import sys
import traceback

class ScheduleGenerator:
    def __init__(self):
        self.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        self.time_slots = ["8AM-10AM", "10AM-12PM", "12PM-2PM", "2PM-4PM", "4PM-6PM", "6PM-8PM", "8PM-10PM"]
        self.conflicts = []
        
    def calculate_empty_slots(self, schedule):
        empty_slots_per_day = {}
        for day in self.days:
            empty_slots = 0
            for slot in self.time_slots:
                if schedule[day][slot] == "":
                    empty_slots += 1
            empty_slots_per_day[day] = empty_slots
        return empty_slots_per_day
        
    def create_course_model(self, course, preferred_slot, sessions_required, current_schedule):
        # Create the model
        model = cp_model.CpModel()
        variables = {}
        
        # Helper function to create variable name
        def var_name(activity, day, slot):
            return f"{activity}_{day}_{slot}"
        
        # Create variables for the course
        course_vars = []
        day_weights = []
        available_days = []
        
        # Calculate empty slots for weighting
        empty_slots_per_day = self.calculate_empty_slots(current_schedule)
        
        # Check available slots for this course in preferred slot
        preferred_slot_days = []
        for day in self.days:
            if current_schedule[day][preferred_slot] == "":
                preferred_slot_days.append(day)
                var = model.NewBoolVar(var_name(f"Study: {course}", day, preferred_slot))
                variables[var_name(f"Study: {course}", day, preferred_slot)] = var
                course_vars.append(var)
                day_weights.append(empty_slots_per_day[day])
                available_days.append(day)
        
        # If we have enough slots in preferred time, use only those
        if len(preferred_slot_days) >= sessions_required:
            # Sort days by weight (empty slots) in descending order
            sorted_indices = sorted(range(len(day_weights)), key=lambda i: day_weights[i], reverse=True)
            sorted_days = [available_days[i] for i in sorted_indices]
            sorted_vars = [course_vars[i] for i in sorted_indices]
            
            # Add constraint that exactly sessions_required slots must be used
            model.Add(sum(course_vars) == sessions_required)
            
            # Force the highest weight days to be used first
            for i in range(sessions_required):
                if i < len(sorted_vars):
                    model.Add(sorted_vars[i] == 1)
            
            return model, variables, course_vars, sorted_days
        
        # If we don't have enough slots in preferred time, return what we have
        # The remaining sessions will be handled in solve_schedule
        if len(preferred_slot_days) > 0:
            # Sort days by weight (empty slots) in descending order
            sorted_indices = sorted(range(len(day_weights)), key=lambda i: day_weights[i], reverse=True)
            sorted_days = [available_days[i] for i in sorted_indices]
            sorted_vars = [course_vars[i] for i in sorted_indices]
            
            # Add constraint that exactly len(preferred_slot_days) slots must be used
            model.Add(sum(course_vars) == len(preferred_slot_days))
            
            # Force the highest weight days to be used first
            for i in range(len(preferred_slot_days)):
                if i < len(sorted_vars):
                    model.Add(sorted_vars[i] == 1)
            
            return model, variables, course_vars, sorted_days
        
        # If no slots are available in preferred time, return None
        return None, None, None, None
    
    def calculate_total_available_slots(self, schedule):
        total_slots = 0
        for day in self.days:
            for slot in self.time_slots:
                if schedule[day][slot] == "":
                    total_slots += 1
        return total_slots

    def solve_schedule(self, college_schedule, external_activities, courses):
        # Initialize schedule with college schedule and external activities
        current_schedule = {day: {slot: "" for slot in self.time_slots} for day in self.days}
        
        # Add college schedule
        for day in self.days:
            last_lecture_slot = None
            for slot in self.time_slots:
                if day in college_schedule and slot in college_schedule[day]:
                    current_schedule[day][slot] = college_schedule[day][slot]
                    last_lecture_slot = slot
            
            # Add break after last lecture/section of the day
            if last_lecture_slot:
                last_index = self.time_slots.index(last_lecture_slot)
                if last_index + 1 < len(self.time_slots):
                    next_slot = self.time_slots[last_index + 1]
                    current_schedule[day][next_slot] = "Break"
        
        # Add external activities
        for activity, (day, preferred_slot, location) in external_activities.items():
            current_schedule[day][preferred_slot] = activity
            
            # Add break after outdoor activities
            if location == "Outdoor":
                slot_index = self.time_slots.index(preferred_slot)
                if slot_index + 1 < len(self.time_slots):
                    next_slot = self.time_slots[slot_index + 1]
                    current_schedule[day][next_slot] = "Break"
        
        # Calculate total required sessions
        total_required_sessions = sum(sessions for _, sessions in courses.values())
        
        # Calculate total available slots
        total_available_slots = self.calculate_total_available_slots(current_schedule)
        
        # Check if we have enough slots for all sessions
        if total_required_sessions > total_available_slots:
            self.conflicts.append(
                f"Cannot create schedule: Required {total_required_sessions} sessions but only "
                f"{total_available_slots} slots are available in the schedule."
            )
            return None
        
        # Create solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 30.0
        solver.parameters.num_search_workers = 8
        
        # Track remaining sessions that couldn't be scheduled in preferred slots
        remaining_sessions = {}
        
        # Schedule each course sequentially
        for course, (preferred_slot, sessions_required) in courses.items():
            model, variables, course_vars, sorted_days = self.create_course_model(course, preferred_slot, sessions_required, current_schedule)
            
            if model is None:
                self.conflicts.append(f"No solution possible for {course} - not enough available slots!")
                return None
            
            # Solve the model
            status = solver.Solve(model)
            
            if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
                # Update schedule with the solution
                sessions_scheduled = 0
                for i in range(sessions_required):
                    if i < len(sorted_days):
                        day = sorted_days[i]
                        current_schedule[day][preferred_slot] = f"Study: {course}"
                        sessions_scheduled += 1
                
                # If not all sessions were scheduled, add to remaining sessions
                if sessions_scheduled < sessions_required:
                    remaining_sessions[course] = {
                        'preferred_slot': preferred_slot,
                        'remaining': sessions_required - sessions_scheduled
                    }
            else:
                self.conflicts.append(f"No solution found for {course}! Status: {status}")
                return None
        
        # Handle remaining sessions
        if remaining_sessions:
            # Schedule remaining sessions
            for course, info in remaining_sessions.items():
                preferred_slot = info['preferred_slot']
                remaining = info['remaining']
                
                # Find closest available slots to preferred slot
                preferred_slot_index = self.time_slots.index(preferred_slot)
                alternative_slots = []
                
                # Look for slots before and after preferred slot
                for i in range(1, len(self.time_slots)):
                    # Check slot before
                    if preferred_slot_index - i >= 0:
                        alt_slot = self.time_slots[preferred_slot_index - i]
                        alternative_slots.append(alt_slot)
                    # Check slot after
                    if preferred_slot_index + i < len(self.time_slots):
                        alt_slot = self.time_slots[preferred_slot_index + i]
                        alternative_slots.append(alt_slot)
                
                # Try to schedule remaining sessions
                for _ in range(remaining):
                    scheduled = False
                    # Recalculate empty slots after each session is scheduled
                    empty_slots = self.calculate_empty_slots(current_schedule)
                    # Sort days by number of empty slots (descending)
                    sorted_days = sorted(self.days, key=lambda day: empty_slots[day], reverse=True)
                    
                    for day in sorted_days:
                        if scheduled:
                            break
                        for slot in alternative_slots:
                            if current_schedule[day][slot] == "":
                                current_schedule[day][slot] = f"Study: {course}"
                                self.conflicts.append(
                                    f"Course '{course}' has been mapped in day '{day}' "
                                    f"in timeslot '{slot}' due to no free slots on timeslot '{preferred_slot}'"
                                )
                                scheduled = True
                                break
        
        return current_schedule
    
    def print_schedule(self, schedule):
        if not schedule:
            return {"schedule": None, "conflicts": self.conflicts}
        
        # Create a DataFrame for better visualization
        df = pd.DataFrame(schedule)
        df.index = self.time_slots
        
        return {
            "schedule": schedule,
            "conflicts": self.conflicts
        }

def generate_schedule(college_schedule, external_activities, courses):
    try:
        generator = ScheduleGenerator()
        schedule = generator.solve_schedule(college_schedule, external_activities, courses)
        return generator.print_schedule(schedule)
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        print("Received input:", json.dumps(input_data), file=sys.stderr)
        
        # Generate schedule
        result = generate_schedule(
            input_data['college_schedule'],
            input_data['external_activities'],
            input_data['courses']
        )
        
        # Output JSON result
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc()
        }))
        sys.exit(1) 