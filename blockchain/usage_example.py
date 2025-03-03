from pet_service import PetService

# Create an instance of PetService
pet_service = PetService()

# Example 1: Adding a new pet using blockchain storage
new_pet = {
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

# Store on blockchain (default)
success = pet_service.add_pet(new_pet)
if success:
    print("Pet added to blockchain successfully!")

# Store locally instead
success = pet_service.add_pet(new_pet, use_blockchain=False)
if success:
    print("Pet added to local storage successfully!")

# Example 2: Retrieving pet data
# From blockchain
blockchain_pet = pet_service.get_pet("dazee_123", use_blockchain=True)
if blockchain_pet:
    print(f"Found pet on blockchain: {blockchain_pet['name']}")

# From local storage
local_pet = pet_service.get_pet("dazee_123", use_blockchain=False)
if local_pet:
    print(f"Found pet in local storage: {local_pet['name']}")

# Example 3: Verify blockchain integrity
is_valid = pet_service.verify_blockchain()
print(f"Blockchain integrity: {'Valid' if is_valid else 'Invalid'}")
