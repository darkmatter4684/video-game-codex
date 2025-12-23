import os
import requests
import time
from typing import Optional, Dict, Any

IGDB_CLIENT_ID = os.getenv("IGDB_CLIENT_ID")
IGDB_CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET")
AUTH_URL = "https://id.twitch.tv/oauth2/token"
BASE_URL = "https://api.igdb.com/v4"

class IGDBClient:
    def __init__(self):
        self.access_token = None
        self.token_expiry = 0
        
    def _authenticate(self):
        if not IGDB_CLIENT_ID or not IGDB_CLIENT_SECRET:
            print("IGDB credentials not set.")
            return

        if self.access_token and time.time() < self.token_expiry:
            return

        params = {
            "client_id": IGDB_CLIENT_ID,
            "client_secret": IGDB_CLIENT_SECRET,
            "grant_type": "client_credentials"
        }
        res = requests.post(AUTH_URL, params=params)
        if res.status_code == 200:
            data = res.json()
            self.access_token = data["access_token"]
            self.token_expiry = time.time() + data["expires_in"] - 60
        else:
            print(f"Failed to authenticate with IGDB: {res.text}")

    def search_game(self, query: str) -> Optional[Dict[str, Any]]:
        self._authenticate()
        if not self.access_token:
            return None
            
        headers = {
            "Client-ID": IGDB_CLIENT_ID,
            "Authorization": f"Bearer {self.access_token}",
        }
        
        # Search for game, get cover and basic info
        body = f'search "{query}"; fields name, cover.url, summary, rating, first_release_date, genres.name, platforms.name; limit 1;'
        
        try:
            res = requests.post(f"{BASE_URL}/games", headers=headers, data=body)
            if res.status_code == 200:
                data = res.json()
                if data:
                    return data[0]
            else:
                print(f"IGDB Search failed: {res.text}")
        except Exception as e:
            print(f"Error connecting to IGDB: {e}")
            
        return None

resolver = IGDBClient()
