import os
import json

GUIDELINES_FILE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "heat_guidelines.json"
)

def retrieve_relevant_guidelines(risk_level, priority_groups):
    """
    Retrieves official safety guidelines from heat_guidelines.json
    matching the current risk level and targeted priority groups.
    
    :param risk_level: string (e.g. "HIGH", "CRITICAL", "MODERATE", "LOW")
    :param priority_groups: list of dicts [{'group': 'Outdoor workers', 'priority': 'VERY_HIGH'}, ...]
    :returns: list of guideline dicts matching the context
    """
    if not os.path.exists(GUIDELINES_FILE):
        return []

    try:
        with open(GUIDELINES_FILE, 'r', encoding='utf-8') as f:
            all_guidelines = json.load(f)
    except Exception as e:
        print("Error loading heat_guidelines.json:", repr(e))
        return []

    risk_level_upper = (risk_level or "").upper()
    group_names = [g["group"] for g in priority_groups] if priority_groups else []

    matching = []
    for item in all_guidelines:
        app_levels = item.get("applicable_risk_levels", [])
        app_groups = item.get("applicable_groups", [])

        # Match if risk level fits or is universal
        matches_risk = not app_levels or risk_level_upper in app_levels or "ALL" in app_levels
        # Match if any targeted population fits
        matches_group = not app_groups or any(grp in app_groups for grp in group_names)

        if matches_risk and matches_group:
            matching.append({
                "id": item.get("id"),
                "organization": item.get("organization"),
                "title": item.get("title"),
                "reference": item.get("reference"),
                "source_url": item.get("source_url"),
                "guideline_text": item.get("guideline_text")
            })

    return matching
