from client.dazee_client import DazeeChainClient

def main():
    # Create a client instance
    client = DazeeChainClient("http://localhost:8000")

    # Example: Adding a new pet
    pet_data = {
        "pet_id": "dazee_123",
        "name": "Luna",
        "breed": "Siamese",
        "age": 2,
        "owner_address": "0x123abc...",
        "metadata": {
            "color": "white",
            "favorite_food": "tuna"
        }
    }

    try:
        # Add pet to blockchain
        result = client.add_pet(pet_data)
        print("Pet added successfully:", result)

        # Retrieve pet data
        retrieved_pet = client.get_pet("dazee_123")
        print("\nRetrieved pet data:", retrieved_pet)

        # Verify blockchain integrity
        is_valid = client.verify_chain()
        print("\nBlockchain integrity:", "Valid" if is_valid else "Invalid")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
