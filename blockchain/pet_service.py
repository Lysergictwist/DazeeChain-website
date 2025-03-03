from .storage_manager import PetStorageManager

class PetService:
    def __init__(self):
        self.storage_manager = PetStorageManager()

    def add_pet(self, pet_data: dict, use_blockchain: bool = True) -> bool:
        """
        Add a new pet to the system.
        
        Example pet_data:
        {
            "pet_id": "dazee_123",
            "name": "Luna",
            "breed": "Siamese",
            "age": 2,
            "owner_address": "0x123...",
            "metadata": {
                "color": "white",
                "favorite_food": "tuna",
                "special_needs": "none"
            }
        }
        """
        return self.storage_manager.store_pet_metadata(pet_data, use_blockchain)

    def get_pet(self, pet_id: str, use_blockchain: bool = True) -> dict:
        """
        Retrieve pet information from storage.
        Returns None if pet is not found.
        """
        return self.storage_manager.get_pet_metadata(pet_id, use_blockchain)

    def verify_blockchain(self) -> bool:
        """
        Verify the integrity of the blockchain.
        """
        return self.storage_manager.verify_blockchain_integrity()
