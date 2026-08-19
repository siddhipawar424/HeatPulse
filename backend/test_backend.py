import requests

polygon = {
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
}

data = {
    "polygon": polygon,
    "date": "2025-07-15",
    "time": "14:00"
}

response = requests.post(
    "http://127.0.0.1:5000/api/analyze",
    json=data
)

print(response.status_code)
print(response.json())