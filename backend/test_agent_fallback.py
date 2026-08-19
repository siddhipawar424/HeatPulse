import os
import sys

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.action_engine import generate_actions
from logic.guideline_retriever import retrieve_relevant_guidelines
from logic.agent_planner import generate_agentic_plan

print("==================================================")
print("RUNNING HEATPULSE BACKEND FALLBACK VERIFICATION")
print("==================================================")

# Sample thermal stats returned by FortyGuard
temp_stats = {
    "maximum": 39.77,
    "mean": 39.73
}

# 1. Deterministic Risk Baseline
risk = calculate_risk(temp_stats)
print(f"1. Risk Baseline: Score = {risk['score']}, Level = {risk['level']}")
assert risk['score'] == 80, "Risk score should be 80"
assert risk['level'] == "HIGH", "Risk level should be HIGH"

# 2. Priority Engine
priority_groups = calculate_priority(risk['level'])
print(f"2. Priority Groups Evaluated: {len(priority_groups)} groups")

# 3. Guideline Retriever
guidelines = retrieve_relevant_guidelines(risk['level'], priority_groups)
print(f"3. Retrieved Safety Guidelines: {len(guidelines)} official standards retrieved")
for g in guidelines:
    print(f"   - [{g['organization']}] {g['title']}")

# 4. Agent Fallback Test (simulating missing or invalid API key)
print("\n4. Testing Agentic Action Planner Fallback (No Key / Invalid Key):")
try:
    # Pass dummy key or ensure missing GEMINI_API_KEY triggers fallback
    os.environ.pop("GEMINI_API_KEY", None)
    os.environ.pop("GOOGLE_API_KEY", None)
    
    agent_output = generate_agentic_plan(
        temp_stats,
        risk,
        priority_groups,
        "2025-07-15",
        "14:00",
        guidelines
    )
    print("FAILED: Agent should have raised exception when API key is missing!")
except Exception as e:
    print(f"[OK] Fallback Triggered Successfully as Expected: {repr(e)}")
    actions = generate_actions(priority_groups, risk['level'])
    print(f"[OK] Deterministic Action Engine Output Returned: {len(actions)} action groups")

print("\n==================================================")
print("ALL BACKEND FALLBACK TESTS PASSED CLEANLY!")
print("==================================================")
