// DazeeRewards Contract Integration
class DazeeRewards {
    constructor() {
        this.contract = null;
        this.contractAddress = null;
        this.web3 = null;
    }

    async initialize(web3Instance, contractAddress, contractABI) {
        this.web3 = web3Instance;
        this.contractAddress = contractAddress;
        this.contract = new this.web3.eth.Contract(contractABI, contractAddress);
    }

    // Admin Functions
    async approveShelter(shelterAddress, monthlyAmount, adminAddress) {
        try {
            return await this.contract.methods.approveShelter(shelterAddress, monthlyAmount)
                .send({ from: adminAddress });
        } catch (error) {
            console.error('Error approving shelter:', error);
            throw error;
        }
    }

    async updateShelterAllocation(shelterAddress, newMonthlyAmount, adminAddress) {
        try {
            return await this.contract.methods.updateShelterAllocation(shelterAddress, newMonthlyAmount)
                .send({ from: adminAddress });
        } catch (error) {
            console.error('Error updating shelter allocation:', error);
            throw error;
        }
    }

    async processReferral(referrerAddress, shelterAddress, adminAddress) {
        try {
            return await this.contract.methods.processReferral(referrerAddress, shelterAddress)
                .send({ from: adminAddress });
        } catch (error) {
            console.error('Error processing referral:', error);
            throw error;
        }
    }

    // Shelter Functions
    async claimMonthlyAllocation(shelterAddress) {
        try {
            return await this.contract.methods.claimMonthlyAllocation()
                .send({ from: shelterAddress });
        } catch (error) {
            console.error('Error claiming monthly allocation:', error);
            throw error;
        }
    }

    async processAdoption(adopterAddress, adoptionId, shelterAddress) {
        try {
            const adoptionHash = this.web3.utils.soliditySha3(
                { t: 'address', v: adopterAddress },
                { t: 'uint256', v: Date.now() }
            );
            return await this.contract.methods.processAdoption(adopterAddress, adoptionHash)
                .send({ from: shelterAddress });
        } catch (error) {
            console.error('Error processing adoption:', error);
            throw error;
        }
    }

    // View Functions
    async getShelterAllocation(shelterAddress) {
        try {
            const allocation = await this.contract.methods.shelterAllocations(shelterAddress).call();
            return {
                monthlyAmount: allocation.monthlyAmount,
                lastClaimTime: new Date(allocation.lastClaimTime * 1000),
                isApproved: allocation.isApproved
            };
        } catch (error) {
            console.error('Error getting shelter allocation:', error);
            throw error;
        }
    }

    async isReferrerVerified(referrerAddress) {
        try {
            return await this.contract.methods.verifiedReferrers(referrerAddress).call();
        } catch (error) {
            console.error('Error checking referrer status:', error);
            throw error;
        }
    }

    async getReferralCount(referrerAddress) {
        try {
            return await this.contract.methods.referralCount(referrerAddress).call();
        } catch (error) {
            console.error('Error getting referral count:', error);
            throw error;
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DazeeRewards;
} else {
    window.DazeeRewards = DazeeRewards;
}
