def calculate_priority(risk_level):

    groups = [
        "Outdoor workers",
        "Elderly people",
        "Children",
        "Outdoor exercisers"
    ]

    prioritized_groups = []

    for group in groups:

        if risk_level == "CRITICAL":
            priority = "CRITICAL"

        elif group == "Outdoor workers":
            priority = "VERY_HIGH"

        elif group in ["Elderly people", "Children", "Outdoor exercisers"]:
            priority = "HIGH"

        else:
            priority = "NORMAL"

        prioritized_groups.append({
            "group": group,
            "priority": priority
        })

    return prioritized_groups

