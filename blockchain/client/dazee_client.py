import requests
from typing import Dict, Optional
import json
import os
from pathlib import Path

class DazeeChainClient:
    def __init__(self, server_url: str = "http://localhost:8000"):
        self.server_url = server_url.rstrip('/')
        self.local_storage_dir = Path.home() / ".dazeechain" / "pets"
        self.local_storage_dir.mkdir(parents=True, exist_ok=True)

    def add_pet(self, pet_data: Dict, use_blockchain: bool = True) -> Dict:
        """
        Add a new pet to either blockchain or local storage
        """
        if use_blockchain:
            response = requests.post(f"{self.server_url}/pet", json=pet_data)
            response.raise_for_status()
            return response.json()
        else:
            # Store locally
            pet_id = pet_data.get("pet_id")
            if not pet_id:
                raise ValueError("pet_id is required for local storage")
            
            file_path = self.local_storage_dir / f"{pet_id}.json"
            with open(file_path, "w") as f:
                json.dump(pet_data, f)
            return {"message": "Pet stored locally", "data": pet_data}

    def get_pet(self, pet_id: str, use_blockchain: bool = True) -> Optional[Dict]:
        """
        Retrieve pet data from either blockchain or local storage
        """
        if use_blockchain:
            response = requests.get(f"{self.server_url}/pet/{pet_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
        else:
            # Get from local storage
            file_path = self.local_storage_dir / f"{pet_id}.json"
            if not file_path.exists():
                return None
            with open(file_path, "r") as f:
                return json.load(f)

    def verify_chain(self) -> bool:
        """
        Verify the integrity of the blockchain
        Only available for blockchain storage
        """
        response = requests.get(f"{self.server_url}/verify")
        response.raise_for_status()
        return response.json()["valid"]

    def get_chain(self) -> Dict:
        """
        Get the entire blockchain
        Only available for blockchain storage
        """
        response = requests.get(f"{self.server_url}/chain")
        response.raise_for_status()
        return response.json()

    def sync_with_server(self, chain_data: Dict):
        """
        Synchronize with the server's blockchain
        Only available for blockchain storage
        """
        response = requests.post(f"{self.server_url}/sync", json=chain_data)
        response.raise_for_status()
        return response.json()
