from storage_manager import PetStorageManager

def main():
    # Initialize the storage manager
    storage = PetStorageManager()

    # Example pet metadata
    pet_data = {
        "pet_id": "pet123",
        "name": "Max",
        "species": "Dog",
        "breed": "Golden Retriever",
        "age": 3,
        "owner": "John Doe"
    }

    # Store in blockchain
    print("Storing pet data in blockchain...")
    storage.store_pet_metadata(pet_data, use_blockchain=True)

    # Store locally
    print("Storing pet data locally...")
    storage.store_pet_metadata(pet_data, use_blockchain=False)

    # Retrieve from blockchain
    blockchain_data = storage.get_pet_metadata("pet123", use_blockchain=True)
    print("\nData from blockchain:", blockchain_data)

    # Retrieve from local storage
    local_data = storage.get_pet_metadata("pet123", use_blockchain=False)
    print("\nData from local storage:", local_data)

    # Verify blockchain integrity
    is_valid = storage.verify_blockchain_integrity()
    print("\nBlockchain integrity:", "Valid" if is_valid else "Invalid")

if __name__ == "__main__":
    main()
