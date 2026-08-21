import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from logic.copilot_engine import generate_copilot_response

print("==================================================")
print("RUNNING HEATPULSE BACKEND COPILOT ENGINE VERIFICATION")
print("==================================================")

sample_fleet_state = [
    {
        "id": "worksite_phoenix_sec_a",
        "name": "Central Avenue Road Widening Project",
        "location": "Central Ave & McDowell Rd, Phoenix, AZ",
        "operating_hours": "06:00 – 16:00",
        "workforce_count": 62,
        "lastAnalyzedTime": "14:00",
        "analysisResult": {
            "risk": {"score": 80, "level": "HIGH", "maximum_temperature": 39.77, "mean_temperature": 39.73},
            "temperature_stats": {"maximum": 39.77, "mean": 39.73},
            "env_params": {
                "heat_index_celsius": 39.6,
                "apparent_temperature_celsius": 40.3,
                "relative_humidity_percent": 22.1,
                "wet_bulb_temperature_celsius": 23.0,
                "air_quality_index": 61.1,
                "solar_ghi": 926.72
            },
            "actions": [
                {
                    "group": "Outdoor workers",
                    "priority": "VERY_HIGH",
                    "actions": ["Implement 50% work / 50% rest ratio", "Provide hydration every 15 mins"]
                }
            ]
        },
        "storedActionStates": {
            "act_outdoor_workers_0": {"status": "ACKNOWLEDGED", "acknowledgedAt": "2026-08-20T10:00:00Z"},
            "act_outdoor_workers_1": {"status": "PENDING"}
        }
    },
    {
        "id": "worksite_suburban_logistics",
        "name": "West Phoenix Distribution & Freight Yard",
        "location": "91st Ave Industrial Corridor, Phoenix, AZ",
        "operating_hours": "05:00 – 15:00",
        "workforce_count": 38,
        "lastAnalyzedTime": "14:00",
        "analysisResult": {
            "risk": {"score": 60, "level": "MODERATE", "maximum_temperature": 36.2, "mean_temperature": 35.8},
            "temperature_stats": {"maximum": 36.2, "mean": 35.8},
            "env_params": {
                "heat_index_celsius": 36.5,
                "apparent_temperature_celsius": 37.1,
                "relative_humidity_percent": 28.0,
                "wet_bulb_temperature_celsius": 21.5,
                "air_quality_index": 45.0,
                "solar_ghi": 880.0
            },
            "actions": [
                {
                    "group": "Delivery workers",
                    "priority": "HIGH",
                    "actions": ["Ensure vehicle air conditioning check", "Schedule rest stops"]
                }
            ]
        },
        "storedActionStates": {
            "act_delivery_workers_0": {"status": "COMPLETED", "completedAt": "2026-08-20T11:00:00Z"}
        }
    }
]

# 1. Test Copilot response generation
print("\n1. Invoking generate_copilot_response() with query 'Which sites need immediate attention today?'...")
res = generate_copilot_response(sample_fleet_state, user_query="Which sites need immediate attention today?")

print(f"\n[OK] Copilot Response Received Successfully!")
print(f"   - Success Flag: {res.get('success')}")
print(f"   - Copilot Executed (Gemini Live): {res.get('copilot_executed')}")
print(f"   - Summary Verdict: {res.get('summary_verdict')}")
print(f"   - Critical Sites Needing Attention ({len(res.get('critical_sites_attention', []))}):")
for site_info in res.get("critical_sites_attention", []):
    print(f"     * [{site_info.get('site_name')}] ({site_info.get('risk_level')}): {site_info.get('reason')}")
print(f"   - Copilot Grounded Answer: {res.get('copilot_answer')}")
print(f"   - Unresolved Directives Summary: {res.get('unresolved_summary')}")
print(f"   - Agent Decision Trace ({len(res.get('agent_trace', []))} steps):")
for step in res.get("agent_trace", []):
    print(f"     -> {step}")

# Assertions
assert res.get("success") is True, "Response must return success: True"
assert isinstance(res.get("agent_trace"), list) and len(res.get("agent_trace")) >= 4, "Decision trace must contain at least 4 operational steps"
assert isinstance(res.get("critical_sites_attention"), list), "Critical sites must be a list"

print("\n==================================================")
print("COPILOT BACKEND VERIFICATION COMPLETED SUCCESSFULLY!")
print("==================================================")
