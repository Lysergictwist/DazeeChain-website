import json
import os
from typing import Dict, Optional
from .blockchain import DazeeChain

class PetStorageManager:
    def __init__(self, storage_dir: str = "pet_data"):
        self.blockchain = DazeeChain()
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

    def store_pet_metadata(self, pet_data: Dict, use_blockchain: bool = True) -> bool:
        try:
            if use_blockchain:
                self.blockchain.add_block(pet_data)
            else:
                pet_id = pet_data.get("pet_id")
                if not pet_id:
                    raise ValueError("Pet ID is required for local storage")
                
                file_path = os.path.join(self.storage_dir, f"{pet_id}.json")
                with open(file_path, 'w') as f:
                    json.dump(pet_data, f)
            return True
        except Exception as e:
            print(f"Error storing pet metadata: {str(e)}")
            return False

    def get_pet_metadata(self, pet_id: str, use_blockchain: bool = True) -> Optional[Dict]:
        try:
            if use_blockchain:
                return self.blockchain.get_pet_metadata(pet_id)
            else:
                file_path = os.path.join(self.storage_dir, f"{pet_id}.json")
                if os.path.exists(file_path):
                    with open(file_path, 'r') as f:
                        return json.load(f)
                return None
        except Exception as e:
            print(f"Error retrieving pet metadata: {str(e)}")
            return None

    def verify_blockchain_integrity(self) -> bool:
        return self.blockchain.is_chain_valid()
