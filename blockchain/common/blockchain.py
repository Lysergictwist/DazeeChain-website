import hashlib
import json
import time
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

@dataclass
class Block:
    index: int
    timestamp: float
    data: Dict
    previous_hash: str
    nonce: int = 0
    hash: str = ""

    def __post_init__(self):
        if not self.hash:
            self.hash = self.calculate_hash()

    def calculate_hash(self) -> str:
        block_dict = asdict(self)
        block_dict.pop('hash')  # Remove hash before calculating
        block_string = json.dumps(block_dict, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> 'Block':
        return cls(**data)

class DazeeChain:
    def __init__(self, difficulty: int = 4):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_transactions: List[Dict] = []
        if not self.chain:
            self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(0, time.time(), {"message": "Genesis Block"}, "0")
        self.mine_block(genesis_block)
        self.chain.append(genesis_block)

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def mine_block(self, block: Block):
        target = "0" * self.difficulty
        while block.hash[:self.difficulty] != target:
            block.nonce += 1
            block.hash = block.calculate_hash()

    def add_block(self, data: Dict) -> Block:
        previous_block = self.get_latest_block()
        new_block = Block(
            len(self.chain),
            time.time(),
            data,
            previous_block.hash
        )
        self.mine_block(new_block)
        self.chain.append(new_block)
        return new_block

    def is_chain_valid(self) -> bool:
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i-1]

            if current_block.hash != current_block.calculate_hash():
                return False

            if current_block.previous_hash != previous_block.hash:
                return False

        return True

    def get_pet_metadata(self, pet_id: str) -> Optional[Dict]:
        for block in reversed(self.chain):
            if block.data.get("pet_id") == pet_id:
                return block.data
        return None

    def to_dict(self) -> Dict:
        return {
            "chain": [block.to_dict() for block in self.chain],
            "difficulty": self.difficulty,
            "pending_transactions": self.pending_transactions
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'DazeeChain':
        chain = cls(difficulty=data["difficulty"])
        chain.chain = [Block.from_dict(block_data) for block_data in data["chain"]]
        chain.pending_transactions = data["pending_transactions"]
        return chain
