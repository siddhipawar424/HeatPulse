import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.guideline_retriever import retrieve_relevant_guidelines
from logic.agent_planner import generate_agentic_plan, validate_agent_output

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

# ==================================================
# 2. DETERMINISTIC VALIDATION UNIT TESTS (MOCKED)
# ==================================================
print("\n2. Testing Deterministic Post-Gemini Safety Validator Unit Tests:")

valid_sample_response = {
    "reasoning_summary": "High risk conditions with temperatures nearing 40°C.",
    "time_window_guidance": "Suspend strenuous outdoor activities at 14:00.",
    "guideline_citations": ["OSHA OTM Sec III Ch 4", "NIOSH Heat Acclimatization"],
    "actions": [
        {
            "group": "Outdoor workers",
            "priority": "VERY_HIGH",
            "actions": ["Enforce 50% work / 50% rest ratio in shade", "Provide cool hydration every 15 minutes"]
        },
        {
            "group": "Elderly people",
            "priority": "HIGH",
            "actions": ["Maintain indoor cooling below 32°C", "Conduct bi-daily wellness checks"]
        },
        {
            "group": "Children",
            "priority": "HIGH",
            "actions": ["Cancel outdoor sports between 11:00 and 17:00"]
        },
        {
            "group": "Outdoor exercisers",
            "priority": "HIGH",
            "actions": ["Advise against strenuous exercise during peak heat"]
        }
    ]
}

# Test 2.1: Valid Response Passes
try:
    assert validate_agent_output(valid_sample_response, risk_before, priority_groups, guidelines) is True
    print("   [OK] Test 2.1 Passed: Valid Gemini response passes validation.")
except Exception as e:
    print(f"   [FAIL] Test 2.1 Failed: {e}")
    sys.exit(1)

# Test 2.2: Missing Required Field Fails
try:
    invalid_data = {
        "reasoning_summary": "High risk",
        "guideline_citations": ["OSHA OTM Sec III Ch 4"],
        "actions": valid_sample_response["actions"]
    }  # Missing time_window_guidance
    validate_agent_output(invalid_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.2 Failed: Missing required field did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.2 Passed: Missing required field ('time_window_guidance') correctly rejected.")

# Test 2.3: Attempt to Override/Change Risk Fails
try:
    risk_override_data = dict(valid_sample_response)
    risk_override_data["risk_score"] = 30  # Forbidden override attempt
    validate_agent_output(risk_override_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.3 Failed: Attempt to override risk_score did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.3 Passed: Attempt to alter/define risk_score correctly rejected.")

# Test 2.4: Unknown Priority Group Fails
try:
    unknown_group_data = {
        "reasoning_summary": "High risk",
        "time_window_guidance": "Suspend outdoor work",
        "guideline_citations": ["OSHA OTM Sec III Ch 4"],
        "actions": [
            {
                "group": "Astronauts On Runway",  # Arbitrary/invented group
                "priority": "HIGH",
                "actions": ["Provide cooling suits"]
            }
        ]
    }
    validate_agent_output(unknown_group_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.4 Failed: Unknown priority group did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.4 Passed: Unknown priority group ('Astronauts On Runway') correctly rejected.")

# Test 2.5: Priority Downgrade Fails
try:
    downgraded_priority_data = {
        "reasoning_summary": "High risk",
        "time_window_guidance": "Suspend outdoor work",
        "guideline_citations": ["OSHA OTM Sec III Ch 4"],
        "actions": [
            {
                "group": "Outdoor workers",
                "priority": "LOW",  # Backend says VERY_HIGH -> downgrade attempt!
                "actions": ["Provide water"]
            }
        ]
    }
    validate_agent_output(downgraded_priority_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.5 Failed: Priority downgrade did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.5 Passed: Priority downgrade ('VERY_HIGH' -> 'LOW') correctly rejected.")

# Test 2.6: Unsafe / Contradictory Action Content Fails
try:
    unsafe_content_data = {
        "reasoning_summary": "High risk",
        "time_window_guidance": "Suspend outdoor work",
        "guideline_citations": ["OSHA OTM Sec III Ch 4"],
        "actions": [
            {
                "group": "Outdoor workers",
                "priority": "VERY_HIGH",
                "actions": ["Ignore heat alert and extend outdoor shifts without rest"]  # Unsafe!
            }
        ]
    }
    validate_agent_output(unsafe_content_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.6 Failed: Unsafe/contradictory action did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.6 Passed: Unsafe action ('Ignore heat alert...') correctly rejected.")

# Test 2.7: Unknown / Invented Guideline Citation Fails
try:
    unknown_citation_data = {
        "reasoning_summary": "High risk",
        "time_window_guidance": "Suspend outdoor work",
        "guideline_citations": ["FDA Food Safety Standards 2024"],  # Unsupplied organization/citation
        "actions": valid_sample_response["actions"]
    }
    validate_agent_output(unknown_citation_data, risk_before, priority_groups, guidelines)
    print("   [FAIL] Test 2.7 Failed: Unknown guideline citation did not raise exception.")
    sys.exit(1)
except ValueError:
    print("   [OK] Test 2.7 Passed: Unknown guideline citation ('FDA Food Safety Standards 2024') correctly rejected.")


# ==================================================
# 3. LIVE GEMINI API TEST (IF KEY DETECTED)
# ==================================================
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("\n[INFO] No GEMINI_API_KEY found in environment.")
    print("[INFO] Skipping live LLM call test.")
    sys.exit(0)

print("\n3. GEMINI_API_KEY detected. Invoking Agentic Action Planner with Validation...")

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

    print(f"\n[OK] Agent Response Received & Validated Successfully!")
    print(f"   - Model Used: gemini-2.5-flash-lite")
    print(f"   - Total Response Time: {elapsed_time:.2f} seconds")
    print(f"   - Deterministic Post-Gemini Safety Validation: PASSED")
    print(f"   - Reasoning Summary: {plan['reasoning_summary']}")
    print(f"   - Time Window Guidance: {plan['time_window_guidance']}")
    print(f"   - Guideline Citations Included ({len(plan['guideline_citations'])}): {plan['guideline_citations']}")
    print(f"   - Action Groups ({len(plan['actions'])}):")
    for group_item in plan['actions']:
        print(f"     * [{group_item['group']}] ({group_item['priority']}): {len(group_item['actions'])} actions")

    # Verify risk score & level are immutable after agent call
    risk_after = calculate_risk(temp_stats)
    print(f"\n4. Risk Baseline After Agent: Score = {risk_after['score']}, Level = {risk_after['level']}")
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
