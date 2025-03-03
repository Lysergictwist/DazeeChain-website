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

@app.get("/")
async def root():
    return {"message": "Welcome to DazeeChain API", "status": "running", "blockchain_length": len(blockchain.chain)}

def start_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_server()
