from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

from services.fortyguard import (
    submit_heatmap,
    get_heatmap_result,
    submit_env_params,
    get_env_params_result
)
from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.action_engine import generate_actions
from logic.guideline_retriever import retrieve_relevant_guidelines
from logic.agent_planner import generate_agentic_plan
from logic.copilot_engine import generate_copilot_response

def _compute_polygon_centroid(polygon):
    """
    Computes the bounding-box centroid (average of min/max lat & lon) from a
    GeoJSON FeatureCollection polygon. This is exact for rectangular AOIs.

    :param polygon: GeoJSON FeatureCollection dict
    :returns: (lat: float, lon: float) tuple
    """
    all_coords = []
    for feature in polygon.get("features", []):
        geometry = feature.get("geometry", {})
        for ring in geometry.get("coordinates", []):
            all_coords.extend(ring)

    if not all_coords:
        raise ValueError("Polygon contains no coordinates — cannot compute centroid")

    lons = [c[0] for c in all_coords]
    lats = [c[1] for c in all_coords]

    centroid_lat = (min(lats) + max(lats)) / 2.0
    centroid_lon = (min(lons) + max(lons)) / 2.0

    return centroid_lat, centroid_lon


@app.route("/")
def home():
    return {
        "message": "HeatPulse Backend with Agentic Action Planner is running!",
        "status": "success"
    }


@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()

        polygon = data["polygon"]
        date = data["date"]
        start_time = data["time"]

        # 1. Ask FortyGuard for heatmap statistics
        activity_id = submit_heatmap(
            polygon,
            date,
            start_time
        )

        result = get_heatmap_result(activity_id)

        temperature_stats = result["stats_data"]["temperature_stats"]

        # 2. FortyGuard Environmental Parameters (non-blocking — fail-safe)
        env_params = None
        try:
            centroid_lat, centroid_lon = _compute_polygon_centroid(polygon)
            env_activity_id = submit_env_params(
                centroid_lat,
                centroid_lon,
                temperature_stats["mean"],
                date,
                start_time
            )
            env_params = get_env_params_result(env_activity_id)
            print(f"\n[SUCCESS] env_params enrichment fetched (heat_index={env_params.get('heat_index_celsius')}°C, rh={env_params.get('relative_humidity_percent')}%)")
        except Exception as env_err:
            print(f"\n[WARNING] env_params enrichment unavailable — continuing without it: {repr(env_err)}")
            env_params = None

        # 3. Deterministic Risk Baseline (Hard Safety Guardrail)
        risk = calculate_risk(temperature_stats)

        # 4. Priority Engine Group Vulnerability Assignment
        priority_groups = calculate_priority(risk["level"])

        # 5. Retrieve Relevant OSHA / WHO / NIOSH Safety Guidelines
        guidelines = retrieve_relevant_guidelines(risk["level"], priority_groups)

        # 6. Agentic Action Planner (with safe deterministic fallback)
        agent_metadata = {
            "agent_executed": False,
            "reasoning_summary": None,
            "time_window_guidance": None,
            "guideline_citations": []
        }

        try:
            agent_plan = generate_agentic_plan(
                temperature_stats,
                risk,
                priority_groups,
                date,
                start_time,
                guidelines,
                env_params=env_params
            )
            actions = agent_plan["actions"]
            agent_metadata = {
                "agent_executed": True,
                "reasoning_summary": agent_plan.get("reasoning_summary"),
                "time_window_guidance": agent_plan.get("time_window_guidance"),
                "guideline_citations": agent_plan.get("guideline_citations", [])
            }
            print("\n[SUCCESS] Agentic Action Planner executed successfully!")

        except Exception as agent_err:
            print("\n[WARNING] Agentic Action Planner unavailable or failed. Executing safe fallback:", repr(agent_err))
            # Safe Fallback to deterministic action_engine
            actions = generate_actions(priority_groups, risk["level"])

        return jsonify({
            "success": True,
            "activity_id": activity_id,
            "risk": risk,
            "priority_groups": priority_groups,
            "actions": actions,
            "temperature_stats": temperature_stats,
            "agent_metadata": agent_metadata,
            "guidelines": guidelines,
            "env_params": env_params
        })

    except Exception as e:
        print("[ERROR] Analysis Endpoint Failure:", repr(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/copilot/query", methods=["POST"])
def copilot_query():
    try:
        data = request.get_json() or {}
        fleet_state = data.get("fleet_state", [])
        query = data.get("query")

        response_data = generate_copilot_response(fleet_state, user_query=query)
        return jsonify(response_data)

    except Exception as e:
        print("[ERROR] Copilot Endpoint Failure:", repr(e))
        return jsonify({
            "success": False,
            "error": str(e),
            "copilot_executed": False
        }), 500


if __name__ == "__main__":
    app.run(debug=True)