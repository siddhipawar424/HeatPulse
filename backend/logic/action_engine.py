def generate_actions(priority_groups, risk_level):

    actions = []

    for item in priority_groups:

        group = item["group"]
        priority = item["priority"]

        if group == "Outdoor workers":
            group_actions = [
                "Provide frequent access to cool drinking water",
                "Take regular rest breaks in shade or a cool area",
                "Consider moving strenuous work to cooler hours"
            ]

        elif group == "Elderly people":
            group_actions = [
                "Encourage regular hydration",
                "Avoid prolonged outdoor heat exposure",
                "Check on vulnerable individuals regularly"
            ]

        elif group == "Children":
            group_actions = [
                "Limit strenuous outdoor activity",
                "Encourage regular hydration",
                "Provide access to a cool or shaded environment"
            ]

        elif group == "Outdoor exercisers":
            group_actions = [
                "Avoid strenuous activity during peak heat",
                "Take regular breaks in a cool or shaded area",
                "Stay hydrated"
            ]

        else:
            group_actions = [
                "Stay hydrated",
                "Limit prolonged exposure to heat",
                "Use cool or shaded areas when needed"
            ]

        actions.append({
            "group": group,
            "priority": priority,
            "actions": group_actions
        })

    return actions

