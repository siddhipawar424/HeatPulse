from flask import Flask, request, jsonify
from services.fortyguard import submit_heatmap, get_heatmap_result
from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.action_engine import generate_actions
from logic.guideline_retriever import retrieve_relevant_guidelines
from logic.agent_planner import generate_agentic_plan

app = Flask(__name__)


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

        # 2. Deterministic Risk Baseline (Hard Safety Guardrail)
        risk = calculate_risk(temperature_stats)

        # 3. Priority Engine Group Vulnerability Assignment
        priority_groups = calculate_priority(risk["level"])

        # 4. Retrieve Relevant OSHA / WHO / NIOSH Safety Guidelines
        guidelines = retrieve_relevant_guidelines(risk["level"], priority_groups)

        # 5. Agentic Action Planner (with safe deterministic fallback)
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
                guidelines
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
            "guidelines": guidelines
        })

    except Exception as e:
        print("[ERROR] Analysis Endpoint Failure:", repr(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
