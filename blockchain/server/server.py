from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Dict, List
import json
import os
import sys
from pathlib import Path

# Add parent directory to path to make imports work
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from blockchain.common.blockchain import DazeeChain, Block
from blockchain.common.referral import ReferralManager, ReferralReward

app = FastAPI(title="DazeeChain Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize blockchain
blockchain = DazeeChain()

# Initialize referral manager
referral_manager = ReferralManager()

# Persistence
BLOCKCHAIN_FILE = "blockchain_data.json"

def save_blockchain():
    try:
        with open(BLOCKCHAIN_FILE, "w") as f:
            json.dump(blockchain.to_dict(), f)
    except Exception as e:
        print(f"Error saving blockchain: {str(e)}")

def load_blockchain():
    global blockchain
    try:
        if os.path.exists(BLOCKCHAIN_FILE) and os.path.isfile(BLOCKCHAIN_FILE):
            with open(BLOCKCHAIN_FILE, "r") as f:
                data = json.load(f)
                blockchain = DazeeChain.from_dict(data)
    except Exception as e:
        print(f"Error loading blockchain: {str(e)}")
        # Continue with a new blockchain

# Load existing blockchain if available
load_blockchain()

@app.post("/pet")
async def add_pet(pet_data: Dict):
    try:
        block = blockchain.add_block(pet_data)
        save_blockchain()
        return {"message": "Pet added successfully", "block": block.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/pet/{pet_id}")
async def get_pet(pet_id: str):
    pet_data = blockchain.get_pet_metadata(pet_id)
    if not pet_data:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet_data

@app.get("/chain")
async def get_chain():
    return blockchain.to_dict()

@app.get("/verify")
async def verify_chain():
    is_valid = blockchain.is_chain_valid()
    return {"valid": is_valid}

@app.post("/sync")
async def sync_chain(chain_data: Dict):
    """
    Synchronize with another node's chain
    If the incoming chain is valid and longer, adopt it
    """
    global blockchain
    incoming_chain = DazeeChain.from_dict(chain_data)
    
    if (len(incoming_chain.chain) > len(blockchain.chain) and 
        incoming_chain.is_chain_valid()):
        blockchain = incoming_chain
        save_blockchain()
        return {"message": "Chain updated successfully"}
    return {"message": "Current chain is up to date"}

# Referral System Endpoints
@app.post("/referrals")
async def create_referral(referral_data: Dict):
    """Create a new shelter referral with reward"""
    try:
        # Extract data from the request
        referrer_id = referral_data.get("referrer_id")
        referrer_email = referral_data.get("referrer_email")
        shelter_name = referral_data.get("shelter_name")
        shelter_email = referral_data.get("shelter_email")
        reward_type = referral_data.get("reward_type", "dazeecoin")
        reward_amount = referral_data.get("reward_amount", 50)
        reward_event = referral_data.get("reward_event")
        
        # Validate required fields
        if not referrer_id or not referrer_email or not shelter_name:
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Create the referral
        referral = referral_manager.create_referral(
            referrer_id=referrer_id,
            referrer_email=referrer_email,
            shelter_name=shelter_name,
            shelter_email=shelter_email,
            reward_type=reward_type,
            reward_amount=reward_amount,
            reward_event=reward_event
        )
        
        return {"message": "Referral created successfully", "referral": referral.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/referrals/{referral_id}")
async def get_referral(referral_id: str):
    """Get a specific referral by ID"""
    referral = referral_manager.get_referral(referral_id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    return referral.to_dict()

@app.get("/referrals/user/{user_id}")
async def get_user_referrals(user_id: str):
    """Get all referrals by a specific user"""
    referrals = referral_manager.get_user_referrals(user_id)
    return {"referrals": [referral.to_dict() for referral in referrals]}

@app.put("/referrals/{referral_id}/status")
async def update_referral_status(referral_id: str, status_data: Dict):
    """Update the status of a referral"""
    status = status_data.get("status")
    if not status or status not in ["pending", "approved", "rejected", "rewarded"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    referral = referral_manager.update_referral_status(referral_id, status)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    return {"message": f"Referral status updated to {status}", "referral": referral.to_dict()}

@app.post("/referrals/{referral_id}/process")
async def process_referral_reward(referral_id: str):
    """Process the reward for an approved referral"""
    result = referral_manager.process_reward(referral_id, blockchain)
    if not result:
        raise HTTPException(status_code=400, detail="Unable to process referral reward")
    
    # If blockchain was updated, save it
    if "block" in result:
        save_blockchain()
    
    return {"message": "Referral reward processed successfully", "result": result}

@app.get("/")
async def root():
    return {"message": "Welcome to DazeeChain API", "status": "running", "blockchain_length": len(blockchain.chain)}

def start_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_server()
