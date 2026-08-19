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


def submit_env_params(lat, lon, temperature, date, start_time):
    """
    Submits an environmental parameters analysis request to FortyGuard /v1/env_params.

    :param lat: float — centroid latitude of the AOI polygon
    :param lon: float — centroid longitude of the AOI polygon
    :param temperature: float — mean temperature (°C) from the heatmap result
    :param date: str — date in YYYY-MM-DD format
    :param start_time: str — hour in HH:MM format
    :returns: str — activity_id for polling
    """
    url = f"{BASE_URL}/env_params"

    headers = {
        "api-key": API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "latitude": lat,
        "longitude": lon,
        "temperature": temperature,
        "date_time": {
            "start_date": date,
            "start_time": start_time,
            "filter_type": 1
        }
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=15
    )

    response.raise_for_status()

    data = response.json()

    return data["data"]["activity_id"]


def get_env_params_result(activity_id):
    """
    Polls /v1/status/{activity_id} until the env_params job completes.
    Returns a normalized flat dict of environmental parameters for the first location.

    :param activity_id: str — from submit_env_params()
    :returns: dict with keys: heat_index_celsius, apparent_temperature_celsius,
              relative_humidity_percent, wet_bulb_temperature_celsius,
              air_quality_index, precipitation_mm, cloud_cover_octas,
              solar_ghi, solar_dni, solar_dhi, co2_ppm, methane_ppb
    :raises: RuntimeError on failure, TimeoutError on timeout
    """
    url = f"{BASE_URL}/status/{activity_id}"

    headers = {
        "api-key": API_KEY
    }

    for _ in range(30):
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()["data"]

        status = data["status"].lower()

        if status in ["completed", "succeeded"]:
            result = data["result"]
            locations = result.get("locations", [])
            if not locations:
                raise RuntimeError("env_params result contained no location data")

            loc = locations[0]
            params = loc.get("parameters", {})
            solar = loc.get("solar_irradiance", {}).get("clear_sky", {})

            # Normalize: each parameter value is a list (one entry per timestamp);
            # take index 0 for the requested hour
            def _first(key):
                val = params.get(key)
                if isinstance(val, list) and len(val) > 0:
                    return val[0]
                return val

            return {
                "heat_index_celsius": _first("heat_index_celsius"),
                "apparent_temperature_celsius": _first("apparent_temperature_celsius"),
                "relative_humidity_percent": _first("relative_humidity_percent"),
                "wet_bulb_temperature_celsius": _first("wet_bulb_temperature_celsius"),
                "air_quality_index": _first("air_quality:idx"),
                "precipitation_mm": _first("precipitation_mm"),
                "cloud_cover_octas": _first("cloud_cover_octas"),
                "solar_ghi": solar.get("ghi"),
                "solar_dni": solar.get("dni"),
                "solar_dhi": solar.get("dhi"),
                "co2_ppm": _first("co2_ppm"),
                "methane_ppb": _first("methane_ppb")
            }

        if status in ["failed", "error"]:
            raise RuntimeError("FortyGuard env_params job failed")

        time.sleep(5)

    raise TimeoutError("env_params processing took too long")

