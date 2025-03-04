class UserProfile {
    constructor(provider, dazeeRewardsAddress, adoptionRewardsAddress) {
        this.provider = provider;
        this.dazeeRewards = new ethers.Contract(
            dazeeRewardsAddress,
            [
                'function getReferralMetrics(address) view returns (uint256, uint256)',
                'function processedAdoptions(address, bytes32) view returns (bool)'
            ],
            provider
        );
        this.adoptionRewards = new ethers.Contract(
            adoptionRewardsAddress,
            [
                'function getAdoptionDetails(bytes32) view returns (address, uint256, bool, bool, address)'
            ],
            provider
        );
    }

    async getUserProfile(address) {
        // Get referral metrics
        const [referralCount, pendingRewards] = await this.dazeeRewards.getReferralMetrics(address);
        
        // Get user's transaction history from events
        const referralFilter = this.dazeeRewards.filters.ReferrerRewarded(address);
        const adoptionFilter = this.adoptionRewards.filters.AdoptionCodeClaimed(null, address);
        
        const referralEvents = await this.dazeeRewards.queryFilter(referralFilter);
        const adoptionEvents = await this.adoptionRewards.queryFilter(adoptionFilter);

        // Calculate total rewards
        const totalReferralRewards = referralEvents.reduce((sum, event) => sum + event.args.amount, 0);
        const totalAdoptionRewards = adoptionEvents.length * 100; // 100 DZ per adoption

        return {
            address,
            stats: {
                totalReferrals: referralCount.toNumber(),
                successfulAdoptions: adoptionEvents.length,
                totalRewardsEarned: totalReferralRewards + totalAdoptionRewards,
                pendingRewards: pendingRewards.toNumber()
            },
            history: {
                referrals: referralEvents.map(event => ({
                    shelter: event.args.shelter,
                    reward: event.args.amount,
                    timestamp: new Date(event.blockTimestamp * 1000)
                })),
                adoptions: await Promise.all(adoptionEvents.map(async event => {
                    const details = await this.adoptionRewards.getAdoptionDetails(event.args.codeHash);
                    return {
                        shelter: details[0],
                        timestamp: new Date(details[1] * 1000),
                        confirmed: details[3]
                    };
                }))
            }
        };
    }

    // Format profile data for display
    formatProfileData(profile) {
        return {
            userAddress: profile.address,
            statistics: {
                referrals: {
                    total: profile.stats.totalReferrals,
                    remaining: 5 - profile.stats.totalReferrals,
                    rewardsEarned: ethers.utils.formatEther(profile.stats.totalRewardsEarned)
                },
                adoptions: {
                    total: profile.stats.successfulAdoptions,
                    rewardsEarned: profile.stats.successfulAdoptions * 100
                },
                rewards: {
                    total: ethers.utils.formatEther(profile.stats.totalRewardsEarned),
                    pending: ethers.utils.formatEther(profile.stats.pendingRewards)
                }
            },
            activityFeed: [
                ...profile.history.referrals.map(ref => ({
                    type: 'referral',
                    shelter: ref.shelter,
                    reward: ethers.utils.formatEther(ref.reward),
                    date: ref.timestamp.toLocaleDateString()
                })),
                ...profile.history.adoptions.map(adopt => ({
                    type: 'adoption',
                    shelter: adopt.shelter,
                    status: adopt.confirmed ? 'Confirmed' : 'Pending',
                    date: adopt.timestamp.toLocaleDateString()
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date))
        };
    }
}
