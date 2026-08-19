import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("FORTYGUARD_API_KEY")

activity_id = "74b8e2db-b9ec-49e7-8750-d9b612a9f8ab"

url = f"https://api.fortyguard.com/v1/status/{activity_id}"

headers = {
    "api-key": api_key
}

while True:
    response = requests.get(url, headers=headers)

    print("Status code:", response.status_code)
    print(response.text)

    data = response.json()["data"]
    status = data["status"].lower()

    if status in ["completed", "succeeded"]:
        print("✅ Heatmap completed!")
        break

    if status in ["failed", "error"]:
        print("❌ Heatmap failed.")
        break

    print("⏳ Still processing...")
    time.sleep(5)
