def calculate_risk(temperature_stats):

    maximum = temperature_stats["maximum"]
    mean = temperature_stats["mean"]

    if maximum >= 40:
        level = "CRITICAL"
        score = 95

    elif maximum >= 38:
        level = "HIGH"
        score = 80

    elif maximum >= 35:
        level = "MODERATE"
        score = 60

    else:
        level = "LOW"
        score = 30

    return {
        "score": score,
        "level": level,
        "maximum_temperature": maximum,
        "mean_temperature": mean
    }

