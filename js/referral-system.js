class ReferralSystem {
    constructor() {
        this.referralPrefix = 'DZ';
        this.referralLength = 8;
    }

    // Generate a unique referral code
    async generateReferralCode(walletAddress) {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 6);
        const addressPart = walletAddress.substring(2, 6);
        return `${this.referralPrefix}-${timestamp}${randomPart}${addressPart}`.toUpperCase();
    }

    // Validate referral code format
    validateReferralCode(code) {
        const pattern = new RegExp(`^${this.referralPrefix}-[A-Z0-9]{${this.referralLength}}$`);
        return pattern.test(code);
    }

    // Store referral in local storage (temporary, should use backend in production)
    async storeReferral(referralCode, referrerData) {
        const referrals = JSON.parse(localStorage.getItem('referrals') || '{}');
        referrals[referralCode] = {
            ...referrerData,
            timestamp: Date.now(),
            used: false,
            verifiedShelter: null
        };
        localStorage.setItem('referrals', JSON.stringify(referrals));
    }

    // Get referral data
    async getReferralData(referralCode) {
        const referrals = JSON.parse(localStorage.getItem('referrals') || '{}');
        return referrals[referralCode];
    }

    // Mark referral as used
    async markReferralUsed(referralCode, shelterData) {
        const referrals = JSON.parse(localStorage.getItem('referrals') || '{}');
        if (referrals[referralCode]) {
            referrals[referralCode].used = true;
            referrals[referralCode].verifiedShelter = shelterData;
            localStorage.setItem('referrals', JSON.stringify(referrals));
            return true;
        }
        return false;
    }

    // Check if user has reached referral limit
    async checkReferralLimit(walletAddress, maxReferrals = 5) {
        const referrals = JSON.parse(localStorage.getItem('referrals') || '{}');
        const userReferrals = Object.values(referrals).filter(
            ref => ref.walletAddress === walletAddress && ref.verifiedShelter
        );
        return userReferrals.length < maxReferrals;
    }
}
