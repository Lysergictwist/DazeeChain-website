class ShelterMetrics {
    constructor(provider, supportPoolAddress) {
        this.provider = provider;
        this.supportPool = new ethers.Contract(
            supportPoolAddress,
            [
                'function getShelterMetrics(address) view returns (uint256, uint256, uint256, uint256, uint256, bool, uint256)',
                'function calculateShelterScore(address) view returns (uint256)'
            ],
            provider
        );
    }

    /**
     * Fetches and formats a shelter's complete metrics
     */
    async getShelterMetrics(shelterAddress) {
        const [
            monthlyAdoptions,
            totalAdoptions,
            joinedTimestamp,
            lastActivityTimestamp,
            engagementScore,
            isActive,
            lastRewardTimestamp
        ] = await this.supportPool.getShelterMetrics(shelterAddress);

        const score = await this.supportPool.calculateShelterScore(shelterAddress);
        const joinedDate = new Date(joinedTimestamp * 1000);
        const lastActivity = new Date(lastActivityTimestamp * 1000);
        const lastReward = new Date(lastRewardTimestamp * 1000);

        return {
            monthlyAdoptions: monthlyAdoptions.toNumber(),
            totalAdoptions: totalAdoptions.toNumber(),
            joinedDate,
            lastActivity,
            lastReward,
            engagementScore: engagementScore.toNumber(),
            isActive,
            score: score.toNumber()
        };
    }

    /**
     * Formats metrics for display
     */
    formatMetricsForDisplay(metrics) {
        const monthsActive = Math.floor((Date.now() - metrics.joinedDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const daysInactive = Math.floor((Date.now() - metrics.lastActivity.getTime()) / (24 * 60 * 60 * 1000));

        return {
            status: metrics.isActive ? 'Active' : 'Inactive',
            monthsActive: `${monthsActive} month${monthsActive !== 1 ? 's' : ''}`,
            adoptionsThisMonth: metrics.monthlyAdoptions,
            totalAdoptions: metrics.totalAdoptions,
            lastActive: daysInactive === 0 ? 'Today' : `${daysInactive} day${daysInactive !== 1 ? 's' : ''} ago`,
            engagementScore: `${metrics.engagementScore}/100`,
            performanceScore: `${metrics.score}/100`,
            lastReward: metrics.lastReward.toLocaleDateString()
        };
    }

    /**
     * Calculates estimated monthly reward based on current pool size and shelter's score
     */
    async estimateMonthlyReward(shelterAddress, poolSize) {
        const score = await this.supportPool.calculateShelterScore(shelterAddress);
        // This is a rough estimate as it depends on other shelters' scores
        return (poolSize * score) / 10000; // Assuming average total score of 10000
    }
}
