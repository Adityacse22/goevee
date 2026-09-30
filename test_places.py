import urllib.request
import json
import sys

import os
from urllib.parse import quote

api_key = quote(os.environ["GOOGLE_MAPS_API_KEY"], safe="")
url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=28.9931,76.9507&radius=10000&type=electric_vehicle_charging_station&key={api_key}"

req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    print(f"Results: {len(data.get('results', []))}")
    for r in data.get('results', [])[:10]:
        print(f"- {r.get('name')} (types: {r.get('types')})")
