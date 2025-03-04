import time
import uuid
from typing import Dict, List, Optional, Union
from dataclasses import dataclass, asdict, field
import json

@dataclass
class ReferralReward:
    """Class for tracking referral rewards"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    referrer_id: str  # User ID of the referrer
    referrer_email: str  # Email of the referrer
    shelter_name: str  # Name of the referred shelter
    shelter_email: Optional[str] = None  # Email of the shelter contact
    reward_type: str = "dazeecoin"  # Type of reward: "dazeecoin" or "event"
    reward_amount: int = 50  # Default amount of DazeeCoins to reward
    reward_event: Optional[Dict] = None  # Details of reward event if applicable
    status: str = "pending"  # Status: pending, approved, rejected, rewarded
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ReferralReward':
        return cls(**data)


class ReferralManager:
    """Manager class for handling shelter referrals and rewards"""
    
    def __init__(self, reward_file: str = "referral_rewards.json"):
        self.reward_file = reward_file
        self.rewards: List[ReferralReward] = []
        self.load_rewards()
    
    def load_rewards(self) -> None:
        """Load rewards from file"""
        try:
            with open(self.reward_file, "r") as f:
                rewards_data = json.load(f)
                self.rewards = [ReferralReward.from_dict(reward) for reward in rewards_data]
        except (FileNotFoundError, json.JSONDecodeError):
            self.rewards = []
    
    def save_rewards(self) -> None:
        """Save rewards to file"""
        with open(self.reward_file, "w") as f:
            json.dump([reward.to_dict() for reward in self.rewards], f, indent=2)
    
    def create_referral(self, referrer_id: str, referrer_email: str, 
                        shelter_name: str, shelter_email: Optional[str] = None,
                        reward_type: str = "dazeecoin", reward_amount: int = 50,
                        reward_event: Optional[Dict] = None) -> ReferralReward:
        """Create a new referral reward entry"""
        reward = ReferralReward(
            referrer_id=referrer_id,
            referrer_email=referrer_email,
            shelter_name=shelter_name,
            shelter_email=shelter_email,
            reward_type=reward_type,
            reward_amount=reward_amount,
            reward_event=reward_event
        )
        self.rewards.append(reward)
        self.save_rewards()
        return reward
    
    def get_referral(self, referral_id: str) -> Optional[ReferralReward]:
        """Get a referral by ID"""
        for reward in self.rewards:
            if reward.id == referral_id:
                return reward
        return None
    
    def get_user_referrals(self, referrer_id: str) -> List[ReferralReward]:
        """Get all referrals by a specific user"""
        return [reward for reward in self.rewards if reward.referrer_id == referrer_id]
    
    def update_referral_status(self, referral_id: str, status: str) -> Optional[ReferralReward]:
        """Update the status of a referral"""
        reward = self.get_referral(referral_id)
        if reward:
            reward.status = status
            reward.updated_at = time.time()
            self.save_rewards()
            return reward
        return None
    
    def process_reward(self, referral_id: str, blockchain=None) -> Optional[Dict]:
        """Process the reward for an approved referral
        
        If blockchain is provided, will add a transaction to the blockchain
        """
        reward = self.get_referral(referral_id)
        if not reward or reward.status != "approved":
            return None
        
        result = {
            "referral_id": reward.id,
            "referrer_id": reward.referrer_id,
            "reward_type": reward.reward_type,
            "processed": False
        }
        
        if reward.reward_type == "dazeecoin":
            # Add DazeeCoins to user's wallet
            # This would integrate with the wallet system
            result["reward_amount"] = reward.reward_amount
            
            # If blockchain is provided, record the transaction
            if blockchain:
                transaction_data = {
                    "transaction_type": "referral_reward",
                    "referrer_id": reward.referrer_id,
                    "shelter_name": reward.shelter_name,
                    "reward_amount": reward.reward_amount,
                    "timestamp": time.time()
                }
                block = blockchain.add_block(transaction_data)
                result["block"] = block.to_dict()
                
            reward.status = "rewarded"
            reward.updated_at = time.time()
            self.save_rewards()
            result["processed"] = True
            
        elif reward.reward_type == "event":
            # Trigger the reward event
            if reward.reward_event:
                # Process the event based on the event details
                # This could be sending an email, triggering a notification, etc.
                result["reward_event"] = reward.reward_event
                
                reward.status = "rewarded"
                reward.updated_at = time.time()
                self.save_rewards()
                result["processed"] = True
        
        return result
