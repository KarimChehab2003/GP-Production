import sys
import json
import joblib
import pandas as pd
import os

# Get absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "cmca_Model.pkl")

# Load the trained AI model
model = joblib.load(model_path)

# Mapping of encoded values to time slots
TIME_SLOT_MAPPING = {
    0: "8AM-10AM", 1: "10AM-12AM", 2: "12PM-2PM", 3: "2PM-4PM",
    4: "4PM-6PM", 5: "6PM-8PM", 6: "8PM-10PM", 7: "10PM-12PM",
    8: "12AM-2AM", 9: "2AM-4AM", 10: "4AM-6AM", 11: "6AM-8AM"
}

def predict_time_slot(input_json, hours_per_week):
    try:
        input_data = json.loads(input_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})

    if "courses" not in input_data or not isinstance(input_data["courses"], list):
        return json.dumps({"error": "Expected an array of courses"})

    num_courses = len(input_data["courses"])
    
    if num_courses == 0:
        return json.dumps({"error": "No courses provided"})

    study_sessions_per_course = max(1, round((hours_per_week / 2) / num_courses))  # Ensure at least 1 session per course
    predictions = {}

    for course in input_data["courses"]:
        if "courseName" not in course or "scores" not in course:
            return json.dumps({"error": "Each course must contain 'courseName' and 'scores'"})

        scores = course["scores"]
        if not all(key in scores for key in ["Computation", "Memorization", "Creativity", "Analysis"]):
            return json.dumps({"error": "Each scores object must contain CMCA scores"})

        # Convert scores to DataFrame
        df = pd.DataFrame([[scores["Computation"], scores["Memorization"], scores["Creativity"], scores["Analysis"]]], 
                          columns=["Computation", "Memorization", "Creativity", "Analysis"])

        # Make prediction
        predicted_index = int(model.predict(df)[0])
        predicted_time_slot = TIME_SLOT_MAPPING.get(predicted_index, "Unknown")

        # Store the output in the required format
        predictions[course["courseName"]] = [predicted_time_slot, study_sessions_per_course]

    return json.dumps(predictions, indent=4)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing hoursPerWeek argument"}))
        sys.exit(1)

    try:
        hours_per_week = int(sys.argv[1])
    except ValueError:
        print(json.dumps({"error": "hoursPerWeek must be an integer"}))
        sys.exit(1)

    input_json = sys.stdin.read().strip()

    if not input_json:
        print(json.dumps({"error": "Empty input received"}))
        sys.exit(1)

    result = predict_time_slot(input_json, hours_per_week)
    print(result)
