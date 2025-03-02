import sys
import json
import joblib
import pandas as pd
import os

# Get absolute path of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "xgboosttt.pkl")

# Load the trained AI model
model = joblib.load(model_path)


def predict_time_slot(input_json):
    try:
        input_data = json.loads(input_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})

    # Convert to DataFrame
    df = pd.DataFrame([[
        input_data["Creativity"], 
        input_data["Memorization"], 
        input_data["Computation"], 
        input_data["Analysis"]
    ]], columns=["Computation", "Memorization", "Creativity", "Analysis"])

    # Make prediction
    predicted_slot = model.predict(df)
    return json.dumps({"predicted_time_slot": int(predicted_slot[0])})


if __name__ == "__main__":
    input_json = sys.stdin.read().strip()

    if not input_json:
        print(json.dumps({"error": "Empty input received"}))
        sys.exit(1)

    result = predict_time_slot(input_json)
    print(result)
