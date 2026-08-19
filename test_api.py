import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("FORTYGUARD_API_KEY")

print("API key loaded:", bool(api_key))

url = "https://api.fortyguard.com/v1/heatmap"

headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

payload = {
    "polygon_aoi": {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [-112.10, 33.44],
                        [-112.08, 33.44],
                        [-112.08, 33.46],
                        [-112.10, 33.46],
                        [-112.10, 33.44]
                    ]]
                }
            }
        ]
    },
    "date_time": {
        "start_date": "2025-07-15",
        "start_time": "14:00",
        "filter_type": 1
    },
    "granularity": 100
}

response = requests.post(
    url,
    headers=headers,
    json=payload
)

print("Status code:", response.status_code)
print("Response:")
print(response.text)
