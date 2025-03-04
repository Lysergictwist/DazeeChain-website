class RegistrationHandler {
    constructor(provider, governanceAddress) {
        this.provider = provider;
        this.governance = new ethers.Contract(
            governanceAddress,
            [
                'function requestShelterVerification(address, string, string, string, string[])',
                'function getShelterVerificationDetails(address) view returns (string, string, string, string[], bool, uint256, uint256)'
            ],
            provider.getSigner()
        );
    }

    // User registration in local storage
    async registerUser(address, userType, userData) {
        const registrationData = {
            address,
            type: userType,
            registrationDate: new Date().toISOString(),
            ...userData
        };

        // Store registration data
        const storageKey = `dazee_registration_${address}`;
        localStorage.setItem(storageKey, JSON.stringify(registrationData));

        // If shelter, initiate verification process
        if (userType === 'shelter') {
            await this.initiateShelterVerification(address, userData);
        }

        return registrationData;
    }

    // Initiate shelter verification process
    async initiateShelterVerification(address, shelterData) {
        try {
            await this.governance.requestShelterVerification(
                address,
                shelterData.ein,
                shelterData.physicalAddress,
                shelterData.website,
                shelterData.socialMediaUrls
            );
            
            // Store verification request timestamp
            const verificationKey = `dazee_verification_${address}`;
            localStorage.setItem(verificationKey, new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Error initiating shelter verification:', error);
            throw error;
        }
    }

    // Check registration status
    async checkRegistrationStatus(address) {
        const storageKey = `dazee_registration_${address}`;
        const registrationData = localStorage.getItem(storageKey);

        if (!registrationData) {
            return { registered: false };
        }

        const data = JSON.parse(registrationData);

        if (data.type === 'shelter') {
            try {
                const [, , , , isVerified, timestamp, approvals] = 
                    await this.governance.getShelterVerificationDetails(address);
                
                return {
                    registered: true,
                    type: 'shelter',
                    verified: isVerified,
                    approvals,
                    registrationDate: data.registrationDate,
                    verificationTimestamp: timestamp.toNumber() * 1000,
                    data: data
                };
            } catch (error) {
                console.error('Error checking shelter verification:', error);
                return {
                    registered: true,
                    type: 'shelter',
                    verified: false,
                    data: data
                };
            }
        }

        return {
            registered: true,
            type: 'user',
            data: data
        };
    }

    // Get registration form fields based on type
    getRegistrationFields(type) {
        const commonFields = [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true }
        ];

        if (type === 'shelter') {
            return [
                ...commonFields,
                { name: 'ein', label: 'EIN Number', type: 'text', required: true },
                { name: 'physicalAddress', label: 'Physical Address', type: 'text', required: true },
                { name: 'website', label: 'Website URL', type: 'url', required: true },
                { name: 'phone', label: 'Contact Phone', type: 'tel', required: true },
                { name: 'description', label: 'Shelter Description', type: 'textarea', required: true },
                { name: 'socialMediaUrls', label: 'Social Media URLs (comma-separated)', type: 'text', required: false }
            ];
        }

        return [
            ...commonFields,
            { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
            { name: 'referralCode', label: 'Referral Code (if any)', type: 'text', required: false }
        ];
    }

    // Redirect user based on type and verification status
    async redirectToappropriateDashboard(address) {
        const status = await this.checkRegistrationStatus(address);
        
        if (!status.registered) {
            window.location.href = '/register.html';
            return;
        }

        switch (status.type) {
            case 'shelter':
                if (status.verified) {
                    window.location.href = '/shelter-dashboard.html';
                } else {
                    window.location.href = '/verification-pending.html';
                }
                break;
            case 'user':
                window.location.href = '/user-dashboard.html';
                break;
            default:
                window.location.href = '/register.html';
        }
    }
}
