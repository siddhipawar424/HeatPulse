import os
import requests
from dotenv import load_dotenv
import time

load_dotenv()

API_KEY = os.getenv("FORTYGUARD_API_KEY")

BASE_URL = "https://api.fortyguard.com/v1"


def submit_heatmap(polygon, date, start_time):
    url = f"{BASE_URL}/heatmap"

    headers = {
        "api-key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "polygon_aoi": polygon,
        "date_time": {
            "start_date": date,
            "start_time": start_time,
            "filter_type": 1
        },
        "granularity": 100
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload
    )

    response.raise_for_status()

    data = response.json()

    return data["data"]["activity_id"]


def get_heatmap_result(activity_id):
    url = f"{BASE_URL}/status/{activity_id}"

    headers = {
        "api-key": API_KEY
    }

    for _ in range(30):
        response = requests.get(
            url,
            headers=headers
        )

        response.raise_for_status()

        data = response.json()["data"]

        status = data["status"].lower()

        if status in ["completed", "succeeded"]:
            return data["result"]

        if status in ["failed", "error"]:
            raise RuntimeError("FortyGuard heatmap failed")

        time.sleep(5)

    raise TimeoutError("Heatmap processing took too long")

