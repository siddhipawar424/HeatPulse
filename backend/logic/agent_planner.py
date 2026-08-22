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


def validate_agent_output(data, risk, priority_groups, guidelines):
    """
    Deterministic post-Gemini safety validation layer.
    Enforces structural validity, risk immutability, priority group integrity,
    priority non-downgrade, safety content rules, and citation verification.

    Raises ValueError on any safety or validation failure.
    """
    # A. Structural Validation
    if not isinstance(data, dict):
        raise ValueError("Agent response is not a valid JSON dictionary")

    # B. Risk Immutability Check
    # Gemini is forbidden from returning or attempting to override risk fields
    forbidden_risk_keys = {"risk_score", "risk_level", "score", "level", "risk"}
    for key in forbidden_risk_keys:
        if key in data:
            raise ValueError(f"Gemini response cannot alter or define risk score/level ('{key}' found in response)")

    required_keys = ["reasoning_summary", "time_window_guidance", "guideline_citations", "actions"]
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Agent response missing required key: '{key}'")

    if not isinstance(data["reasoning_summary"], str) or not data["reasoning_summary"].strip():
        raise ValueError("reasoning_summary must be a non-empty string")

    if not isinstance(data["time_window_guidance"], str) or not data["time_window_guidance"].strip():
        raise ValueError("time_window_guidance must be a non-empty string")

    if not isinstance(data["guideline_citations"], list):
        raise ValueError("guideline_citations must be a list")

    if not isinstance(data["actions"], list) or len(data["actions"]) == 0:
        raise ValueError("Agent response actions must be a non-empty list")

    # Map backend priority groups and their priority ranks
    backend_group_map = {}
    if priority_groups and isinstance(priority_groups, list):
        for pg in priority_groups:
            if isinstance(pg, dict) and "group" in pg:
                backend_group_map[pg["group"]] = (pg.get("priority") or "NORMAL").upper()

    priority_ranks = {
        "CRITICAL": 4,
        "VERY_HIGH": 3,
        "VERY HIGH": 3,
        "HIGH": 2,
        "MODERATE": 1,
        "NORMAL": 1,
        "LOW": 1,
    }

    # C, D, E. Actions, Groups, Priority & Content Safety Validation
    authoritative_risk_level = (risk.get("level") if isinstance(risk, dict) else "LOW").upper()

    unsafe_phrases = [
        "ignore heat alert",
        "disregard heat warning",
        "disregard heat alert",
        "no action needed for critical heat",
        "override safety limits",
        "bypass safety",
        "ignore safety",
        "ignore thermal risk",
    ]

    unsafe_high_risk_phrases = [
        "increase outdoor exposure",
        "skip rest breaks",
        "cancel rest breaks",
        "no rest breaks",
        "skip hydration",
        "cancel hydration",
        "avoid hydration",
        "avoid water",
        "stop drinking water",
        "extend outdoor shifts without rest",
    ]

    for item in data["actions"]:
        if not isinstance(item, dict):
            raise ValueError("Every action item must be a dictionary")

        for req_field in ["group", "priority", "actions"]:
            if req_field not in item:
                raise ValueError(f"Action item missing required field: '{req_field}'")

        group_name = item["group"]
        gemini_priority = (item["priority"] or "").upper()
        group_actions = item["actions"]

        # Risk immutability check within item dict
        for key in forbidden_risk_keys:
            if key in item:
                raise ValueError(f"Action item cannot contain risk definition field: '{key}'")

        # C. Priority-Group Validation
        if backend_group_map and group_name not in backend_group_map:
            raise ValueError(f"Invalid priority group in Gemini output: '{group_name}' (not in backend priority groups)")

        # D. Priority Non-Downgrade Validation
        if backend_group_map and group_name in backend_group_map:
            backend_priority = backend_group_map[group_name]
            backend_rank = priority_ranks.get(backend_priority, 1)
            gemini_rank = priority_ranks.get(gemini_priority, 0)
            if gemini_rank < backend_rank:
                raise ValueError(
                    f"Priority downgrade detected for group '{group_name}': "
                    f"Gemini priority '{gemini_priority}' is lower than backend priority '{backend_priority}'"
                )

        # Actions list validation
        if not isinstance(group_actions, list) or len(group_actions) == 0:
            raise ValueError(f"Action list for group '{group_name}' must be a non-empty list of strings")

        for act_str in group_actions:
            if not isinstance(act_str, str) or not act_str.strip():
                raise ValueError(f"Action directive in group '{group_name}' must be a non-empty string")

            act_lower = act_str.lower()
            # E. Safety Content Checks
            for phrase in unsafe_phrases:
                if phrase in act_lower:
                    raise ValueError(f"Unsafe action content detected: '{act_str}' contains forbidden instruction '{phrase}'")

            if authoritative_risk_level in ["HIGH", "CRITICAL", "VERY_HIGH"]:
                for phrase in unsafe_high_risk_phrases:
                    if phrase in act_lower:
                        raise ValueError(f"Unsafe action content detected under {authoritative_risk_level} risk: '{act_str}' contains '{phrase}'")

    # F. Guideline Citation Validation
    if guidelines and isinstance(guidelines, list):
        valid_orgs = set()
        valid_keywords = set()
        for g in guidelines:
            if isinstance(g, dict):
                org = (g.get("organization") or "").upper()
                if org:
                    valid_orgs.add(org)
                    if org == "NIOSH":
                        valid_orgs.add("CDC")
                    elif org == "WHO":
                        valid_orgs.add("WMO")

                title = (g.get("title") or "").lower()
                ref = (g.get("reference") or "").lower()
                gid = (g.get("id") or "").lower()

                for word in (title + " " + ref + " " + gid).split():
                    clean_word = "".join(c for c in word if c.isalnum())
                    if len(clean_word) > 2:
                        valid_keywords.add(clean_word)

        for citation in data["guideline_citations"]:
            if not isinstance(citation, str) or not citation.strip():
                raise ValueError("Guideline citation must be a non-empty string")

            cite_upper = citation.upper()
            cite_lower = citation.lower()

            # Organization check
            has_valid_org = any(org in cite_upper for org in valid_orgs)
            if not has_valid_org:
                raise ValueError(f"Unknown guideline citation organization in '{citation}': organization not in retrieved guidelines")

            # Keyword overlap check
            cite_words = ["".join(c for c in w if c.isalnum()) for w in cite_lower.split()]
            has_keyword_match = any(w in valid_keywords for w in cite_words if len(w) > 2)
            if not has_keyword_match:
                raise ValueError(f"Unknown guideline citation in '{citation}': does not match any retrieved safety guideline")

    return True


def _call_gemini_api(temperature_stats, risk, priority_groups, date, time, guidelines, api_key, env_params=None):
    """
    Internal synchronous call to Gemini API using google-genai SDK with 12s HTTP timeout.
    """
    http_opts = types.HttpOptions(timeout=12000)
    client = genai.Client(api_key=api_key, http_options=http_opts)

    system_instruction = """
You are the HeatPulse Agentic Action Planner, an expert AI climate-health safety engine.
Your sole purpose is to interpret microclimate thermal statistics and official regulatory guidelines (OSHA, WHO, NIOSH) to generate a structured, context-aware heat intervention plan.

STRICT SAFETY CONSTRAINTS:
1. You CANNOT change, modify, or recalculate the numeric risk score or risk level. The provided risk level and score are authoritative.
2. You CANNOT downgrade the safety baseline under any circumstances.
3. You MUST cite the provided official guidelines accurately. DO NOT invent fake regulatory requirements or numerical safety limits.
4. Output MUST be valid JSON adhering strictly to the required schema.
"""

    env_context_block = ""
    if env_params:
        env_context_block = f"""

ENVIRONMENTAL CONTEXT (FortyGuard /v1/env_params — use for richer, more specific recommendations):
- Heat Index: {env_params.get('heat_index_celsius')}°C
- Apparent Temperature (Feels Like): {env_params.get('apparent_temperature_celsius')}°C
- Relative Humidity: {env_params.get('relative_humidity_percent')}%
- Wet-Bulb Temperature: {env_params.get('wet_bulb_temperature_celsius')}°C
- Air Quality Index: {env_params.get('air_quality_index')} (0=Good, 100+=Unhealthy)
- Precipitation: {env_params.get('precipitation_mm')} mm
- Solar GHI (Clear-Sky): {env_params.get('solar_ghi')} W/m²
IMPORTANT: Use this environmental context to ENRICH your action specificity (e.g., reference the exact humidity or heat index). Do NOT use it to override, modify, or recalculate the Authoritative Risk Level or Score."""

    prompt = f"""
TARGET ANALYSIS CONTEXT:
- Date: {date}
- Target Hour / Window: {time}
- Maximum Temperature: {risk.get('maximum_temperature')}°C
- Mean Temperature: {risk.get('mean_temperature')}°C
- Authoritative Risk Level: {risk.get('level')}
- Authoritative Risk Score: {risk.get('score')}/100{env_context_block}

TARGET POPULATION PRIORITY GROUPS:
{json.dumps(priority_groups, indent=2)}

RETRIEVED OFFICIAL SAFETY GUIDELINES:
{json.dumps(guidelines, indent=2)}

TASK:
Synthesize the thermal statistics, population priority groups, and official guidelines to generate a structured JSON object containing:
1. "reasoning_summary": A concise 2-sentence explanation of why this local thermal severity is dangerous for the target window.
2. "time_window_guidance": Specific operational advisory for the selected hour ({time}).
3. "guideline_citations": Array of strings citing the relevant official standards used (e.g., "OSHA OTM Sec III Ch 4", "WHO Senior Heat Guidance").
4. "actions": Array of objects for EACH priority group, matching:
   [
     {{
       "group": "<Group Name>",
       "priority": "<Priority Level>",
       "actions": ["Specific step 1 citing guideline thresholds", "Specific step 2", "Specific step 3"]
     }}
   ]

Return ONLY the raw JSON object. Do not include markdown code block formatting.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.2
        )
    )

    return response.text


def generate_agentic_plan(temperature_stats, risk, priority_groups, date, time, guidelines, env_params=None):
    """
    Generates an agentic action plan using gemini-2.5-flash-lite with official 12s HTTP timeout and schema validation.
    If GEMINI_API_KEY is missing, or if API call fails/times out, raises an exception
    so caller executes deterministic fallback to action_engine.py.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in environment")

    if not GENAI_AVAILABLE:
        raise ImportError("google-genai SDK is not installed")

    # Execute API call with SDK HttpOptions 12s timeout
    raw_result = _call_gemini_api(
        temperature_stats,
        risk,
        priority_groups,
        date,
        time,
        guidelines,
        api_key,
        env_params=env_params
    )

    # Parse JSON structure
    clean_json = raw_result.strip()
    if clean_json.startswith("```"):
        clean_json = clean_json.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(clean_json)
    except Exception as parse_err:
        raise ValueError(f"Agent response is not valid JSON: {parse_err}")

    # Deterministic post-Gemini safety validation layer
    validate_agent_output(data, risk, priority_groups, guidelines)

    return data
