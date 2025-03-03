class ShelterVerification {
    static async verifyShelter(shelterData) {
        try {
            // First, perform basic verification steps
            const verificationSteps = [
                this.verifyTaxStatus,
                this.verifyStateLicense,
                this.verifyUSDALicense,
                this.verifyLocation,
                this.verifyOnlinePresence,
                this.verifyDocuments,
                this.verifyReferences,
                this.performRiskAssessment
            ];

            const results = await Promise.all(verificationSteps.map(step => step(shelterData)));
            const basicVerificationPassed = results.every(result => result.status === 'verified');

            if (!basicVerificationPassed) {
                const failedSteps = results.filter(r => r.status !== 'verified')
                    .map(r => r.message).join(', ');
                return { status: 'failed', message: `Basic verification failed: ${failedSteps}` };
            }

            // If basic verification passes, proceed with AI verification
            // First, check if we're using the ai-verification.js module
            if (typeof AIShelterVerification === 'undefined') {
                console.warn('AIShelterVerification not available, using legacy verification');
                return this.legacyVerification(shelterData, results);
            }
            
            // Use the enhanced AI verification
            const aiVerification = await AIShelterVerification.verifyWithAI(shelterData);
            
            // Always submit for manual review first, as per client requirement
            return {
                status: 'pending_review',
                score: aiVerification.score,
                message: 'Your application has been submitted for manual review',
                aiVerification: aiVerification,
                basicVerification: results,
                shelterData: {
                    ...shelterData,
                    verificationScore: aiVerification.score,
                    submissionDate: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Verification Error:', error);
            return { status: 'error', message: 'An error occurred during verification' };
        }
    }

    static async legacyVerification(shelterData, basicResults) {
        // Simulate AI verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Legacy code path when AI verification module is not available
        const verificationRecord = {
            timestamp: new Date().toISOString(),
            basicVerification: basicResults,
            status: 'pending_review',
            shelterData: {
                ...shelterData,
                verificationScore: 75,
                submissionDate: new Date().toISOString()
            }
        };

        return {
            status: 'pending_review',
            score: 75,
            message: 'Your application has been submitted for manual review',
            details: verificationRecord
        };
    }
    
    static async submitForManualReview(shelterData, verificationResults) {
        try {
            // In production, this would call an API to submit the application for review
            
            // Store the verification data in our database
            await this.storeVerificationData(shelterData, verificationResults);
            
            // Generate a unique referral code for this shelter
            const referralCode = this.generateReferralCode(shelterData.name);
            
            // Send email notification to admins about new shelter submission
            await this.sendAdminNotification(shelterData);
            
            return {
                status: 'submitted',
                referralCode,
                message: 'Your shelter application has been submitted for manual review. You will be notified when the review is complete.'
            };
        } catch (error) {
            console.error('Manual Review Submission Error:', error);
            return { status: 'error', message: 'Failed to submit for manual review' };
        }
    }
    
    static async storeVerificationData(shelterData, verificationResults) {
        // In production, this would store all data in a database
        // For now, we'll simulate this operation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Store in localStorage for demo purposes
        try {
            const pendingShelters = JSON.parse(localStorage.getItem('pendingShelters') || '[]');
            pendingShelters.push({
                id: this.generateUniqueId(),
                shelterData,
                verificationResults,
                status: 'pending',
                submissionDate: new Date().toISOString()
            });
            localStorage.setItem('pendingShelters', JSON.stringify(pendingShelters));
        } catch (e) {
            console.error('Error storing shelter data:', e);
        }
        
        return true;
    }
    
    static async sendAdminNotification(shelterData) {
        // In production, this would send an email to administrators
        console.log('New shelter submission:', shelterData.name);
        return true;
    }
    
    static generateReferralCode(shelterName) {
        // Generate a unique referral code based on shelter name and timestamp
        const cleanName = shelterName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        const timestamp = Date.now().toString(36).substring(4, 8).toUpperCase();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `${cleanName}-${timestamp}-${random}`;
    }
    
    static generateUniqueId() {
        return 'shelter_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    static async verifyTaxStatus(shelterData) {
        try {
            // In production, this would call the IRS API to verify tax-exempt status
            const { ein } = shelterData;
            if (!ein || !ein.match(/^\d{2}-\d{7}$/)) {
                return { status: 'failed', message: 'Invalid EIN format' };
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return { status: 'verified', message: 'Tax status verified' };
        } catch (error) {
            return { status: 'failed', message: 'Tax status verification failed' };
        }
    }

    static async verifyStateLicense(shelterData) {
        try {
            // In production, this would verify the license with state authorities
            const { licenseNumber, state } = shelterData;
            if (!licenseNumber || !state) {
                return { status: 'failed', message: 'Missing license information' };
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'State license verified' };
        } catch (error) {
            return { status: 'failed', message: 'License verification failed' };
        }
    }

    static async verifyUSDALicense(shelterData) {
        try {
            const { usdaLicense } = shelterData;
            if (!usdaLicense) {
                return { status: 'verified', message: 'USDA license not required' };
            }

            // Simulate USDA API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'USDA license verified' };
        } catch (error) {
            return { status: 'failed', message: 'USDA license verification failed' };
        }
    }

    static async verifyLocation(shelterData) {
        try {
            const { address, city, state, zip } = shelterData;
            if (!address || !city || !state || !zip) {
                return { status: 'failed', message: 'Incomplete address information' };
            }

            // In production, this would:
            // 1. Verify address exists using Google Maps API
            // 2. Check if the location type is appropriate for a shelter
            // 3. Verify zoning permits for animal shelter operation
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'Location verified' };
        } catch (error) {
            return { status: 'failed', message: 'Location verification failed' };
        }
    }

    static async verifyOnlinePresence(shelterData) {
        try {
            const { website, socialMedia } = shelterData;
            
            // In production, this would:
            // 1. Check if website is active and secure
            // 2. Verify social media accounts exist and are active
            // 3. Check reviews and ratings
            // 4. Look for news articles or press mentions
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'Online presence verified' };
        } catch (error) {
            return { status: 'failed', message: 'Online presence verification failed' };
        }
    }

    static async verifyDocuments(shelterData) {
        try {
            const { documents } = shelterData;
            if (!documents || !documents.tax_exempt || !documents.state_license) {
                return { status: 'failed', message: 'Missing required documents' };
            }

            // In production, this would:
            // 1. Use AI to analyze document authenticity
            // 2. Extract and verify information from documents
            // 3. Check for document tampering
            // 4. Verify document dates and validity periods
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'Documents verified' };
        } catch (error) {
            return { status: 'failed', message: 'Document verification failed' };
        }
    }

    static async verifyReferences(shelterData) {
        try {
            // In production, this would:
            // 1. Contact veterinary references
            // 2. Verify vet licenses
            // 3. Contact partner shelters
            // 4. Check professional associations
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'References verified' };
        } catch (error) {
            return { status: 'failed', message: 'Reference verification failed' };
        }
    }

    static async performRiskAssessment(shelterData) {
        try {
            // In production, this would use AI to:
            // 1. Analyze patterns in submitted data
            // 2. Check for red flags
            // 3. Compare against known fraud patterns
            // 4. Assess overall risk score
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'verified', message: 'Risk assessment passed' };
        } catch (error) {
            return { status: 'failed', message: 'Risk assessment failed' };
        }
    }

    static async registerOnBlockchain(shelterData) {
        try {
            // In production, this would:
            // 1. Create a verification record
            // 2. Hash the shelter's data
            // 3. Store the hash on the blockchain
            // 4. Generate a verification certificate
            await new Promise(resolve => setTimeout(resolve, 1000));

            return { status: 'success', message: 'Registered on blockchain' };
        } catch (error) {
            throw new Error('Blockchain registration failed');
        }
    }
}

// Make the class available globally
window.ShelterVerification = ShelterVerification;
