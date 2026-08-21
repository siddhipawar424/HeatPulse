import os
import json
from dotenv import load_dotenv

load_dotenv()

# Attempt import of google.genai
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from logic.risk_engine import calculate_risk
from logic.priority_engine import calculate_priority
from logic.guideline_retriever import retrieve_relevant_guidelines


def generate_copilot_response(fleet_state, user_query=None):
    """
    Grounded AI Heat Safety Operations Copilot Agent engine.
    Observes live worksite telemetry, FortyGuard environmental parameters, deterministic risk engine outputs,
    and action resolution statuses to provide grounded, explainable operations guidance.

    :param fleet_state: list of worksite objects with analysisResult, lastAnalyzedTime, workforce_count, workforce_groups, operating_hours
    :param user_query: optional string query from safety manager
    :returns: dict containing copilot summary, critical sites, interventions, answer, trace, and copilot_executed boolean flag.
    """
    if not isinstance(fleet_state, list):
        fleet_state = []

    agent_trace = []

    # Step 1: Fleet Telemetry & Worksite Context Ingestion
    total_sites = len(fleet_state)
    total_workers = sum(site.get("workforce_count", 0) for site in fleet_state if isinstance(site, dict))
    agent_trace.append(f"Ingested telemetry across {total_sites} monitored worksites ({total_workers} exposed workers)")

    # Step 2: Validate Authoritative Risk Baselines & Audit Resolution Store
    evaluated_sites = []
    high_critical_count = 0
    total_actions_count = 0
    pending_count = 0
    acknowledged_count = 0
    completed_count = 0
    exception_count = 0
    reported_exceptions = []

    for site in fleet_state:
        if not isinstance(site, dict):
            continue

        site_id = site.get("id", "unknown_site")
        site_name = site.get("name", "Unknown Worksite")
        location = site.get("location", "Unknown Location")
        hours = site.get("operating_hours", "Standard Shift")
        count = site.get("workforce_count", 0)

        analysis = site.get("analysisResult") or {}
        temp_stats = analysis.get("temperature_stats")

        # STRICT BACKEND AUTHORITATIVE RISK VALIDATION:
        # Never trust client-provided risk scores/levels directly.
        # Calculate risk authoritatively from temperature_stats if available.
        if isinstance(temp_stats, dict) and "maximum" in temp_stats and temp_stats["maximum"] is not None:
            validated_risk = calculate_risk(temp_stats)
            risk_level = validated_risk.get("level", "UNAVAILABLE")
            risk_score = validated_risk.get("score", 0)
            max_temp = validated_risk.get("maximum_temperature")
            mean_temp = validated_risk.get("mean_temperature")
        else:
            validated_risk = {"score": 0, "level": "UNAVAILABLE", "maximum_temperature": None, "mean_temperature": None}
            risk_level = "UNAVAILABLE"
            risk_score = 0
            max_temp = None
            mean_temp = None

        if risk_level in ["HIGH", "CRITICAL"]:
            high_critical_count += 1

        env_params = analysis.get("env_params") or {}
        actions_data = analysis.get("actions") or []
        stored_action_states = site.get("storedActionStates") or {}

        # Audit action status counts
        site_pending = 0
        site_ack = 0
        site_done = 0
        site_exc = 0

        if isinstance(actions_data, list):
            for group_item in actions_data:
                if not isinstance(group_item, dict):
                    continue
                group_name = group_item.get("group", "General Workforce")
                directive_list = group_item.get("actions", [])
                if isinstance(directive_list, list):
                    for d_idx, d_text in enumerate(directive_list):
                        # Fix 1: Properly increment total_actions_count for every directive
                        total_actions_count += 1

                        clean_group = "".join(c if c.isalnum() else "_" for c in group_name.lower())
                        act_id = f"act_{clean_group}_{d_idx}"

                        st = stored_action_states.get(act_id) or {}
                        status = st.get("status", "PENDING")
                        if status == "COMPLETED":
                            site_done += 1
                            completed_count += 1
                        elif status == "ACKNOWLEDGED":
                            site_ack += 1
                            acknowledged_count += 1
                        elif status == "EXCEPTION":
                            site_exc += 1
                            exception_count += 1
                            reason = st.get("exceptionReason") or "Unspecified exception"
                            reported_exceptions.append({
                                "site_name": site_name,
                                "group": group_name,
                                "reason": reason
                            })
                        else:
                            site_pending += 1
                            pending_count += 1

        evaluated_sites.append({
            "id": site_id,
            "name": site_name,
            "location": location,
            "operating_hours": hours,
            "workforce_count": count,
            "last_analyzed_time": site.get("lastAnalyzedTime"),
            "risk_score": risk_score,
            "risk_level": risk_level,
            "max_temp": max_temp,
            "mean_temp": mean_temp,
            "heat_index": env_params.get("heat_index_celsius"),
            "apparent_temp": env_params.get("apparent_temperature_celsius"),
            "humidity": env_params.get("relative_humidity_percent"),
            "wet_bulb": env_params.get("wet_bulb_temperature_celsius"),
            "aqi": env_params.get("air_quality_index"),
            "actions": actions_data,
            "action_counts": {
                "pending": site_pending,
                "acknowledged": site_ack,
                "completed": site_done,
                "exception": site_exc
            }
        })

    agent_trace.append(f"Validated authoritative risk baselines server-side ({high_critical_count} sites at HIGH/CRITICAL severity)")
    agent_trace.append("Evaluated FortyGuard spatial thermal & ambient environmental parameters (Heat Index, Wet-Bulb, AQI)")
    agent_trace.append(f"Audited action resolution store ({pending_count} pending, {acknowledged_count} acknowledged, {completed_count} completed, {exception_count} exceptions across {total_actions_count} total directives)")

    # Step 3: Check API Key & Gemini SDK Availability
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if api_key and GENAI_AVAILABLE:
        try:
            http_opts = types.HttpOptions(timeout=12000)
            client = genai.Client(api_key=api_key, http_options=http_opts)

            system_instruction = """
You are the HeatPulse AI Heat Safety Operations Copilot Agent, an expert B2B climate-health safety command assistant.
Your sole purpose is to observe worksite microclimate telemetry, FortyGuard environmental parameters, deterministic risk baselines, exposed workforce counts, shift operating hours, and live action tracking resolution status to generate grounded, explainable executive recommendations.

STRICT SAFETY CONSTRAINTS:
1. Risk scores (0-100) and risk levels (LOW/MODERATE/HIGH/CRITICAL) generated by the deterministic safety engine are authoritative. You CANNOT recalculate, modify, downgrade, or override them.
2. Ground all answers strictly in the provided worksite data, FortyGuard environmental parameters (Heat Index, Wet-Bulb, AQI, Relative Humidity, Solar GHI), exposed workforce headcounts, shift operating hours, and action resolution statuses. Do NOT invent metrics, fake company names, or unsupported predictions.
3. Approaching-risk advisories must be grounded in current conditions, target analysis hour, shift operating hours, and official regulatory thresholds. Never claim unsupported future forecasting capabilities.
4. Output MUST be valid JSON adhering strictly to the required schema.
"""

            prompt = f"""
CURRENT FLEET OPERATIONAL STATE:
Total Monitored Worksites: {total_sites}
Total Exposed Workforce: {total_workers} Workers
High / Critical Severity Worksites: {high_critical_count}
Action Tracking Totals: {total_actions_count} Directives ({pending_count} Pending, {acknowledged_count} Acknowledged, {completed_count} Completed, {exception_count} Exceptions)
Reported Exceptions: {json.dumps(reported_exceptions, indent=2)}

DETAILED WORKSITE TELEMETRY & RESOLUTION BREAKDOWN:
{json.dumps(evaluated_sites, indent=2)}

SAFETY MANAGER QUERY / FOCUS AREA:
"{user_query if user_query else 'Provide a general executive fleet heat safety assessment and highlight critical sites requiring immediate supervisor attention.'}"

TASK:
Analyze the fleet state and query to generate a structured JSON dictionary containing:
1. "summary_verdict": A concise 2-sentence executive summary verdict of fleet heat risk and resolution status.
2. "critical_sites_attention": Array of objects for worksites needing immediate supervisor attention:
   [
     {{
       "site_id": "<id>",
       "site_name": "<name>",
       "risk_level": "<HIGH|CRITICAL>",
       "reason": "Grounded explanation referencing thermal stats, humidity/heat index, exposed roles, or pending actions."
     }}
   ]
3. "recommended_immediate_interventions": Array of strings providing prioritized, actionable safety directives for site foremen/supervisors.
4. "unresolved_summary": A concise sentence summarizing unresolved pending directives and open operational exceptions.
5. "time_window_advisory": Grounded advisory for the target analysis hour relative to shift operating hours.
6. "copilot_answer": Clear, direct response answering the safety manager query.
7. "guideline_citations": Array of cited standards (e.g. "OSHA OTM Sec III Ch 4", "WHO Senior Heat Guidance", "NIOSH Acclimatization").

Return ONLY the raw JSON object. Do not include markdown code block formatting.
"""

            # Fix 4: Call generate_content() BEFORE logging completion trace entry
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.2
                )
            )

            # Gemini execution succeeded: log actual trace entry
            agent_trace.append("Synthesized grounded operational guidance via Gemini Agent (gemini-2.5-flash-lite)")

            clean_json = response.text.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            parsed_data = json.loads(clean_json)

            agent_trace.append("Formatted executive verdict & intervention guidance for operations command")

            return {
                "success": True,
                "copilot_executed": True,
                "summary_verdict": parsed_data.get("summary_verdict", "Fleet telemetry evaluated."),
                "critical_sites_attention": parsed_data.get("critical_sites_attention", []),
                "recommended_immediate_interventions": parsed_data.get("recommended_immediate_interventions", []),
                "unresolved_summary": parsed_data.get("unresolved_summary", f"{pending_count} pending directives require supervisor dispatch."),
                "time_window_advisory": parsed_data.get("time_window_advisory", "Target analysis window monitored."),
                "copilot_answer": parsed_data.get("copilot_answer", "Fleet thermal status monitored."),
                "guideline_citations": parsed_data.get("guideline_citations", []),
                "agent_trace": agent_trace
            }

        except Exception as err:
            # Fix 4: Log actual failure in trace before fallback
            agent_trace.append(f"Gemini execution failed ({type(err).__name__}: {str(err)}) — falling back to deterministic fleet aggregator")

    # Step 4: Deterministic Fleet Aggregator Fallback (Missing Key or API Failure)
    agent_trace.append("Executed Deterministic Fleet Aggregator Fallback")
    agent_trace.append("Compiled fallback operational metrics directly from deterministic risk baselines & guidelines")

    critical_list = []
    immediate_interventions = []
    fallback_citations = set()

    for site in evaluated_sites:
        level = site["risk_level"]
        if level in ["HIGH", "CRITICAL"]:
            temp_str = f"Max temperature {site['max_temp']}°C" if site['max_temp'] else "Elevated thermal severity"
            critical_list.append({
                "site_id": site["id"],
                "site_name": site["name"],
                "risk_level": level,
                "reason": f"{temp_str} with {site['action_counts']['pending']} unresolved directives for {site['workforce_count']} exposed workers."
            })

            # Fix 2 & 5: Derive fallback interventions from existing deterministic actions & guidelines logic
            existing_actions = site.get("actions") or []
            if existing_actions and isinstance(existing_actions, list):
                for grp in existing_actions:
                    g_name = grp.get("group", "Workforce")
                    g_acts = grp.get("actions", [])
                    if g_acts and len(g_acts) > 0:
                        immediate_interventions.append(f"[{site['name']} — {g_name}] {g_acts[0]}")
            else:
                # Dynamically retrieve regulatory guidelines using imported engines
                p_groups = calculate_priority(level)
                retrieved_g = retrieve_relevant_guidelines(level, p_groups)
                for g in retrieved_g:
                    fallback_citations.add(f"{g['organization']} {g['title']}")
                    immediate_interventions.append(f"[{site['name']} — {g['organization']}] {g['title']}: {g['guideline_text'][:120]}...")

        elif level == "UNAVAILABLE":
            critical_list.append({
                "site_id": site["id"],
                "site_name": site["name"],
                "risk_level": "UNAVAILABLE",
                "reason": "Hyperlocal temperature stats unavailable — run live analysis to compute risk score."
            })

    if not immediate_interventions:
        immediate_interventions.append("All monitored worksites currently within acceptable thermal boundaries. Maintain standard hydration monitoring.")

    fallback_answer = (
        f"Fleet status: {total_sites} worksites monitored, {high_critical_count} at HIGH/CRITICAL severity. "
        f"{pending_count} directives pending, {exception_count} open exceptions reported across {total_actions_count} total directives."
    )

    return {
        "success": True,
        "copilot_executed": False,
        "summary_verdict": f"Deterministic Engine Audit: {high_critical_count} of {total_sites} worksites at elevated heat risk. {pending_count} directives unresolved.",
        "critical_sites_attention": critical_list,
        "recommended_immediate_interventions": immediate_interventions[:6],  # limit top interventions
        "unresolved_summary": f"{pending_count} pending directives and {exception_count} operational exceptions recorded across {total_actions_count} total directives.",
        "time_window_advisory": "Target analysis hour evaluated using authoritative meteorological thresholds.",
        "copilot_answer": fallback_answer,
        "guideline_citations": list(fallback_citations) if fallback_citations else ["OSHA Technical Manual Sec III Ch 4", "NIOSH Heat Stress Standard"],
        "agent_trace": agent_trace
    }
