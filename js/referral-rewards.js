/**
 * Referral Rewards System
 * Handles the process of referring shelters and receiving rewards
 */

class ReferralRewards {
    constructor() {
        this.apiBaseUrl = '/api'; // Adjust based on your API setup
    }

    /**
     * Submit a shelter referral and claim the reward
     * @param {Object} referralData - The referral data
     * @returns {Promise<Object>} - The response from the server
     */
    async submitReferral(referralData) {
        try {
            // Get user wallet data
            const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
            if (!walletData) {
                throw new Error('You need to create a wallet to earn referral rewards');
            }

            // Add referrer ID and email to the referral data
            const completeReferralData = {
                ...referralData,
                referrer_id: walletData.address,
                referrer_email: referralData.referrer.email
            };

            // Submit the referral to the server
            const response = await fetch(`${this.apiBaseUrl}/referrals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(completeReferralData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit referral');
            }

            const result = await response.json();
            
            // Show the reward notification
            this.showRewardNotification(result.referral);
            
            return result;
        } catch (error) {
            console.error('Error submitting referral:', error);
            throw error;
        }
    }

    /**
     * Get all referrals for the current user
     * @returns {Promise<Array>} - List of user's referrals
     */
    async getUserReferrals() {
        try {
            const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
            if (!walletData) {
                throw new Error('Wallet not found');
            }

            const response = await fetch(`${this.apiBaseUrl}/referrals/user/${walletData.address}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to get referrals');
            }

            const result = await response.json();
            return result.referrals;
        } catch (error) {
            console.error('Error getting user referrals:', error);
            throw error;
        }
    }

    /**
     * Show a notification about the pending reward
     * @param {Object} referral - The referral data
     */
    showRewardNotification(referral) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        
        let rewardText = '';
        if (referral.reward_type === 'dazeecoin') {
            rewardText = `${referral.reward_amount} DazeeCoins`;
        } else if (referral.reward_type === 'event') {
            rewardText = 'a special reward event';
        }
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-gift text-2xl text-orange-500"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Referral Reward Pending!</h2>
                    <p class="text-gray-600 mb-6">
                        Thank you for referring ${referral.shelter_name}! Once this shelter is verified, 
                        you'll receive ${rewardText} as a reward.
                    </p>
                    <p class="text-gray-500 mb-6 text-sm">
                        The verification process usually takes 1-3 business days. You'll be notified 
                        when your reward is ready to claim.
                    </p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="bg-orange-500 text-white py-2 px-6 rounded-lg hover:bg-orange-600 transition duration-200">
                        Got it!
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Claim a pending reward
     * @param {string} referralId - The ID of the referral
     * @returns {Promise<Object>} - The result of the claim
     */
    async claimReward(referralId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/referrals/${referralId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to claim reward');
            }

            const result = await response.json();
            
            // If the reward is DazeeCoins, update the wallet
            if (result.result.reward_type === 'dazeecoin' && result.result.processed) {
                this.updateWalletBalance(result.result.reward_amount);
            }
            
            return result;
        } catch (error) {
            console.error('Error claiming reward:', error);
            throw error;
        }
    }

    /**
     * Update the user's wallet balance with the reward amount
     * @param {number} amount - The amount of DazeeCoins to add
     */
    updateWalletBalance(amount) {
        try {
            const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
            if (!walletData) return;
            
            walletData.balance += amount;
            walletData.transactions.push({
                type: 'referral_reward',
                amount: amount,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
            
            // If we're on the dashboard page, update the displayed balance
            const balanceElement = document.getElementById('walletBalance');
            if (balanceElement) {
                balanceElement.textContent = walletData.balance;
            }
        } catch (error) {
            console.error('Error updating wallet balance:', error);
        }
    }

    /**
     * Display the user's referral history
     * @param {string} containerId - The ID of the container element
     */
    async displayReferralHistory(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const referrals = await this.getUserReferrals();
            
            if (referrals.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-500">You haven't referred any shelters yet.</p>
                        <a href="refer-shelter.html" class="text-orange-500 hover:underline mt-2 inline-block">
                            Refer a Shelter Now
                        </a>
                    </div>
                `;
                return;
            }
            
            let html = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shelter
                                </th>
                                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reward
                                </th>
                                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
            `;
            
            referrals.forEach(referral => {
                const date = new Date(referral.created_at * 1000).toLocaleDateString();
                let rewardText = '';
                if (referral.reward_type === 'dazeecoin') {
                    rewardText = `${referral.reward_amount} DZ`;
                } else {
                    rewardText = 'Special Event';
                }
                
                let statusClass = '';
                switch (referral.status) {
                    case 'pending':
                        statusClass = 'text-yellow-500';
                        break;
                    case 'approved':
                        statusClass = 'text-green-500';
                        break;
                    case 'rejected':
                        statusClass = 'text-red-500';
                        break;
                    case 'rewarded':
                        statusClass = 'text-blue-500';
                        break;
                }
                
                let actionButton = '';
                if (referral.status === 'approved') {
                    actionButton = `
                        <button onclick="referralRewards.claimReward('${referral.id}')" 
                                class="bg-orange-500 text-white py-1 px-3 rounded text-xs hover:bg-orange-600">
                            Claim Reward
                        </button>
                    `;
                } else if (referral.status === 'rewarded') {
                    actionButton = `<span class="text-green-500 text-xs">Claimed</span>`;
                } else {
                    actionButton = `<span class="text-gray-400 text-xs">N/A</span>`;
                }
                
                html += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${referral.shelter_name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${date}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${rewardText}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">
                            ${referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${actionButton}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = html;
        } catch (error) {
            console.error('Error displaying referral history:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-red-500">Error loading referral history. Please try again later.</p>
                    </div>
                `;
            }
        }
    }
}

// Initialize the referral rewards system
const referralRewards = new ReferralRewards();
