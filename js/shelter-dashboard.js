class ShelterDashboard {
    constructor(provider, dazeeRewardsAddress, adoptionRewardsAddress, governanceAddress) {
        this.provider = provider;
        this.dazeeRewards = new ethers.Contract(
            dazeeRewardsAddress,
            [
                'function getShelterMetrics(address) view returns (uint256, uint256, uint256, uint256, bool)',
                'function monthlyRewardPool() view returns (uint256)'
            ],
            provider
        );
        this.adoptionRewards = new ethers.Contract(
            adoptionRewardsAddress,
            [
                'function getAdoptionDetails(bytes32) view returns (address, uint256, bool, bool, address)',
                'function generateAdoptionCodeHash(address, string, uint256) pure returns (bytes32)'
            ],
            provider
        );
        this.governance = new ethers.Contract(
            governanceAddress,
            [
                'function getShelterVerificationDetails(address) view returns (string, string, string, string[], bool, uint256, uint256)'
            ],
            provider
        );
    }

    async getShelterDashboard(shelterAddress) {
        // Get shelter metrics
        const [monthlyAmount, adoptionCount, engagementScore, lastClaim, isApproved] = 
            await this.dazeeRewards.getShelterMetrics(shelterAddress);
        
        // Get verification details
        const [ein, address, website, socialMedia, isVerified, verificationTime, approvals] = 
            await this.governance.getShelterVerificationDetails(shelterAddress);
        
        // Get monthly reward pool
        const monthlyPool = await this.dazeeRewards.monthlyRewardPool();
        
        // Get adoption history from events
        const adoptionFilter = this.adoptionRewards.filters.AdoptionConfirmed(null, shelterAddress);
        const adoptionEvents = await this.adoptionRewards.queryFilter(adoptionFilter);
        
        // Calculate metrics
        const monthlyAdoptions = adoptionEvents.filter(event => 
            event.blockTimestamp >= lastClaim.toNumber()
        ).length;
        
        const estimatedReward = this.calculateEstimatedReward(
            monthlyAmount,
            engagementScore,
            monthlyAdoptions,
            monthlyPool
        );

        return {
            profile: {
                ein,
                address,
                website,
                socialMedia,
                verificationStatus: {
                    isVerified,
                    approvals: approvals.toNumber(),
                    since: new Date(verificationTime.toNumber() * 1000)
                }
            },
            metrics: {
                totalAdoptions: adoptionCount.toNumber(),
                monthlyAdoptions,
                engagementScore: engagementScore.toNumber(),
                monthlyAllocation: monthlyAmount,
                estimatedNextReward: estimatedReward,
                lastClaimDate: new Date(lastClaim.toNumber() * 1000)
            },
            adoptionHistory: await Promise.all(adoptionEvents.map(async event => {
                const details = await this.adoptionRewards.getAdoptionDetails(event.args.codeHash);
                return {
                    adopter: details[4],
                    timestamp: new Date(event.blockTimestamp * 1000),
                    reward: 100 // Fixed reward amount
                };
            }))
        };
    }

    calculateEstimatedReward(monthlyAmount, engagementScore, adoptionCount, monthlyPool) {
        // Base reward (25% of monthly allocation)
        const baseReward = monthlyAmount.mul(2500).div(10000);
        
        // Performance bonus based on engagement score (0-100%)
        const performanceBonus = baseReward.mul(engagementScore).div(100);
        
        // Adoption bonus (increases with more adoptions)
        const adoptionBonus = ethers.BigNumber.from(adoptionCount)
            .mul(ethers.utils.parseEther("10")); // 10 DZ per adoption
        
        return baseReward.add(performanceBonus).add(adoptionBonus);
    }

    // Format dashboard data for display
    formatDashboardData(dashboard) {
        const now = new Date();
        const daysSinceLastClaim = Math.floor(
            (now - dashboard.metrics.lastClaimDate) / (1000 * 60 * 60 * 24)
        );

        return {
            shelterInfo: {
                name: dashboard.profile.name,
                address: dashboard.profile.address,
                website: dashboard.profile.website,
                verificationStatus: dashboard.profile.verificationStatus.isVerified ? 'Verified' : 'Pending',
                verifiedSince: dashboard.profile.verificationStatus.since.toLocaleDateString()
            },
            performance: {
                adoptions: {
                    total: dashboard.metrics.totalAdoptions,
                    thisMonth: dashboard.metrics.monthlyAdoptions,
                    trend: this.calculateTrend(dashboard.adoptionHistory)
                },
                engagement: {
                    score: dashboard.metrics.engagementScore,
                    level: this.getEngagementLevel(dashboard.metrics.engagementScore)
                },
                rewards: {
                    monthly: ethers.utils.formatEther(dashboard.metrics.monthlyAllocation),
                    estimated: ethers.utils.formatEther(dashboard.metrics.estimatedNextReward),
                    nextClaimIn: Math.max(0, 30 - daysSinceLastClaim)
                }
            },
            recentActivity: dashboard.adoptionHistory
                .slice(0, 10)
                .map(adoption => ({
                    type: 'Adoption',
                    adopter: adoption.adopter,
                    reward: adoption.reward,
                    date: adoption.timestamp.toLocaleDateString()
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date))
        };
    }

    calculateTrend(adoptionHistory) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentAdoptions = adoptionHistory.filter(a => a.timestamp > thirtyDaysAgo);
        const previousAdoptions = adoptionHistory.filter(
            a => a.timestamp <= thirtyDaysAgo && a.timestamp > thirtyDaysAgo - (30 * 24 * 60 * 60 * 1000)
        );
        
        return {
            direction: recentAdoptions.length >= previousAdoptions.length ? 'up' : 'down',
            percentage: previousAdoptions.length ? 
                Math.round((recentAdoptions.length - previousAdoptions.length) / previousAdoptions.length * 100) : 
                100
        };
    }

    getEngagementLevel(score) {
        if (score >= 90) return 'Outstanding';
        if (score >= 75) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Improvement';
    }
}
