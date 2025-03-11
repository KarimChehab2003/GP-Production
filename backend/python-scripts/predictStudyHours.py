import sys
import json
import joblib
import pandas as pd
import os

# Get absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "student_performance_model.pkl")

# Load the trained AI model
model = joblib.load(model_path)

# Mapping predicted score index to study time range
study_time_mapping = {
    0: 5,
    1: 10,
    2: 15,
    3: 20,
    4: 21
}

def predict_exam_score(input_json):
    try:
        # Ensure input_json is a dictionary
        if isinstance(input_json, str):  
            input_data = json.loads(input_json)
        else:
            input_data = input_json  # Already a dictionary
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})

    # Define expected feature names
    feature_names = [
        "Access_to_Resources", "Extracurricular_Activities", "Sleep_Hours", "Previous_Scores",
        "Tutoring_Sessions", "Parental_Education_Level", "Distance_from_Home", "Exam_Score"
    ]

    if not all(feature in input_data for feature in feature_names):
        return json.dumps({"error": "Missing required features in input JSON"})

    # Convert to DataFrame
    df = pd.DataFrame([[input_data[feature] for feature in feature_names]], columns=feature_names)

    # Make prediction
    predicted_score = int(model.predict(df)[0])  # Ensure it's an int

    # Get study time range from mapping
    study_time_range = study_time_mapping.get(predicted_score, "Unknown range")

    # return json.dumps({
    #     "Predicted Study Time Score": predicted_score,
    #     "Study Time Range": study_time_range
    # })

    return study_time_range

if __name__ == "__main__":
    input_json = sys.stdin.read().strip()

    if not input_json:
        print(json.dumps({"error": "Empty input received"}))
        sys.exit(1)

    result = predict_exam_score(input_json)
    print(result)
