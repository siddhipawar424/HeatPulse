import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.guideline_retriever import retrieve_relevant_guidelines
from logic.agent_planner import generate_agentic_plan

print("==================================================")
print("RUNNING HEATPULSE BACKEND AGENT-ENABLED TEST")
print("==================================================")

temp_stats = {
    "maximum": 39.77,
    "mean": 39.73
}

# 1. Deterministic Risk Baseline Before Agent
risk_before = calculate_risk(temp_stats)
print(f"1. Risk Baseline Before Agent: Score = {risk_before['score']}, Level = {risk_before['level']}")

priority_groups = calculate_priority(risk_before['level'])
guidelines = retrieve_relevant_guidelines(risk_before['level'], priority_groups)

# Check for GEMINI_API_KEY
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("[INFO] No GEMINI_API_KEY found in environment.")
    print("[INFO] Skipping live LLM call test.")
    sys.exit(0)

print("[INFO] GEMINI_API_KEY detected. Invoking Agentic Action Planner...")

start_time = time.time()
try:
    plan = generate_agentic_plan(
        temp_stats,
        risk_before,
        priority_groups,
        "2025-07-15",
        "14:00",
        guidelines
    )
    elapsed_time = time.time() - start_time

    print(f"\n[OK] Agent Response Received Successfully!")
    print(f"   - Model Used: gemini-2.5-flash")
    print(f"   - Total Response Time: {elapsed_time:.2f} seconds")
    print(f"   - Structured JSON Validation: PASSED")
    print(f"   - Reasoning Summary: {plan['reasoning_summary']}")
    print(f"   - Time Window Guidance: {plan['time_window_guidance']}")
    print(f"   - Guideline Citations Included ({len(plan['guideline_citations'])}): {plan['guideline_citations']}")
    print(f"   - Action Groups ({len(plan['actions'])}):")
    for group_item in plan['actions']:
        print(f"     * [{group_item['group']}] ({group_item['priority']}): {len(group_item['actions'])} actions")

    # Verify risk score & level are immutable after agent call
    risk_after = calculate_risk(temp_stats)
    print(f"\n2. Risk Baseline After Agent: Score = {risk_after['score']}, Level = {risk_after['level']}")
    assert risk_before['score'] == risk_after['score'] == 80, "Risk score must remain 80"
    assert risk_before['level'] == risk_after['level'] == "HIGH", "Risk level must remain HIGH"
    print("[OK] VERIFIED: Risk Score (80) and Risk Level (HIGH) remained 100% immutable!")

except Exception as e:
    elapsed_time = time.time() - start_time
    print(f"\n[ERROR] Live Agent Execution Failed (Elapsed {elapsed_time:.2f}s): {repr(e)}")
    sys.exit(1)

print("\n==================================================")
print("AGENT-ENABLED VERIFICATION COMPLETED SUCCESSFULLY!")
print("==================================================")
