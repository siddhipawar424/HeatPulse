from flask import Flask, request, jsonify
from services.fortyguard import submit_heatmap, get_heatmap_result
from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.action_engine import generate_actions


app = Flask(__name__)


@app.route("/")
def home():
    return {
        "message": "HeatPulse Backend is running!",
        "status": "success"
    }


@app.route("/api/analyze", methods=["POST"])
def analyze():

    try:
        data = request.get_json()

        polygon = data["polygon"]
        date = data["date"]
        start_time = data["time"]

        # 1. Ask FortyGuard for heatmap
        activity_id = submit_heatmap(
            polygon,
            date,
            start_time
        )

        result = get_heatmap_result(activity_id)

        temperature_stats = result["stats_data"]["temperature_stats"]

        risk = calculate_risk(temperature_stats)

        priority_groups = calculate_priority(
            risk["level"]
        )

        actions = generate_actions(
            priority_groups,
            risk["level"]
        )

        print("\n========== RESULT KEYS ==========")
        print(result.keys())

        print("\n========== RESULT STRUCTURE ==========")
        for key, value in result.items():
            print(key, "->", type(value))

        return jsonify({
            "success": True,
            "activity_id": activity_id,
            "risk": risk,
            "priority_groups": priority_groups,
            "actions": actions,
            "temperature_stats": temperature_stats
        })

    except Exception as e:

        print("ERROR:", repr(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)


