import sys
import json
import joblib
import pandas as pd
import os

# Get absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "xgboost.pkl")

# Load the trained AI model
model = joblib.load(model_path)

# Mapping of encoded values to time slots (modify if needed)
TIME_SLOT_MAPPING = {
    0: "8AM-10AM",
    1: "10AM-12AM",
    2: "12PM-2PM",
    3: "2PM-4PM",
    4: "4PM-6PM",
    5: "6PM-8PM",
    6: "8PM-10PM",
    7: "10PM-12PM",
    8: "12AM-2AM",
    9: "2AM-4AM",
    10: "4AM-6AM",
    11: "6AM-8AM"
}

def predict_time_slot(input_json):
    try:
        input_data = json.loads(input_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})

    if not isinstance(input_data, list):
        return json.dumps({"error": "Expected an array of courses"})

    predictions = []
    
    for course in input_data:
        if "Creativity" not in course or "Memorization" not in course or "Computation" not in course or "Analysis" not in course:
            return json.dumps({"error": "Each course must contain CMCA scores"})

        # Convert to DataFrame
        df = pd.DataFrame([[
            course["Computation"], 
            course["Memorization"], 
            course["Creativity"], 
            course["Analysis"]
        ]], columns=["Computation", "Memorization", "Creativity", "Analysis"])

        # Make prediction
        predicted_index = int(model.predict(df)[0])  # Ensure it's an integer
        predicted_time_slot = TIME_SLOT_MAPPING.get(predicted_index, "Unknown")

        predictions.append({"scores": course, "predicted_time_slot": predicted_time_slot})

    return json.dumps(predictions)


if __name__ == "__main__":
    input_json = sys.stdin.read().strip()

    if not input_json:
        print(json.dumps({"error": "Empty input received"}))
        sys.exit(1)

    result = predict_time_slot(input_json)
    print(result)
