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


def _call_gemini_api(temperature_stats, risk, priority_groups, date, time, guidelines, api_key, env_params=None):
    """
    Internal synchronous call to Gemini API using google-genai SDK with 12s HTTP timeout.
    """
    # Configure 12-second HTTP network timeout (12000 ms) via types.HttpOptions
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

    # Build optional environmental context block when env_params data is available
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

    :param env_params: optional dict from FortyGuard /v1/env_params — used to enrich the
                       Gemini prompt with real humidity, heat index, AQI, etc. If None,
                       the prompt runs without environmental context (no effect on fallback).
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

    # Parse and validate JSON structure
    clean_json = raw_result.strip()
    if clean_json.startswith("```"):
        clean_json = clean_json.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    data = json.loads(clean_json)

    # Validation check
    if not isinstance(data, dict):
        raise ValueError("Agent response is not a valid JSON dictionary")

    required_keys = ["reasoning_summary", "time_window_guidance", "guideline_citations", "actions"]
    for key in required_keys:
        if key not in data:
            raise ValueError(f"Agent response missing required key: {key}")

    if not isinstance(data["actions"], list) or len(data["actions"]) == 0:
        raise ValueError("Agent response actions must be a non-empty list")

    # Validate action item schema
    for item in data["actions"]:
        if not isinstance(item, dict) or "group" not in item or "actions" not in item:
            raise ValueError("Malformed action item in agent response")

    return data
