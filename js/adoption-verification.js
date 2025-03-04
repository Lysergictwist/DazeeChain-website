// DazeeChain Adoption Verification System
class AdoptionVerificationSystem {
    constructor() {
        this.pendingVerifications = [];
        this.verifiedAdoptions = [];
        this.rewardAmount = 100; // Default DazeeCoin reward amount
        this.loadStoredData();
    }

    // Load any stored verification data from localStorage
    loadStoredData() {
        try {
            const pendingData = localStorage.getItem('pendingVerifications');
            const verifiedData = localStorage.getItem('verifiedAdoptions');
            
            if (pendingData) {
                this.pendingVerifications = JSON.parse(pendingData);
            }
            
            if (verifiedData) {
                this.verifiedAdoptions = JSON.parse(verifiedData);
            }
        } catch (error) {
            console.error('Error loading stored verification data:', error);
        }
    }

    // Save current verification data to localStorage
    saveData() {
        try {
            localStorage.setItem('pendingVerifications', JSON.stringify(this.pendingVerifications));
            localStorage.setItem('verifiedAdoptions', JSON.stringify(this.verifiedAdoptions));
        } catch (error) {
            console.error('Error saving verification data:', error);
        }
    }

    // Fast Track: QR Code Verification for registered shelters
    async verifyQrCode(qrCodeData) {
        try {
            // Validate QR code format
            if (!this.isValidQrFormat(qrCodeData)) {
                throw new Error('Invalid QR code format');
            }
            
            // Parse QR code data
            const { adoptionId, shelterId, timestamp, signature } = JSON.parse(qrCodeData);
            
            // Verify QR code hasn't been used before
            if (this.isQrCodeUsed(adoptionId)) {
                throw new Error('This adoption has already been verified');
            }
            
            // Verify shelter is registered
            const shelterVerified = await this.verifyShelter(shelterId);
            if (!shelterVerified) {
                throw new Error('Shelter not registered with DazeeChain');
            }
            
            // Verify signature (this would call blockchain verification in production)
            const signatureValid = await this.verifySignature(adoptionId, shelterId, timestamp, signature);
            if (!signatureValid) {
                throw new Error('Invalid signature');
            }
            
            // Process the reward
            const walletAddress = DazeeWallet.getWalletAddress();
            if (!walletAddress) {
                throw new Error('No wallet connected');
            }
            
            // Create verification record
            const verificationRecord = {
                adoptionId,
                shelterId,
                timestamp,
                verificationMethod: 'qrCode',
                walletAddress,
                rewardAmount: this.rewardAmount,
                verificationDate: new Date().toISOString(),
                status: 'verified'
            };
            
            // Add to verified list
            this.verifiedAdoptions.push(verificationRecord);
            this.saveData();
            
            // Trigger reward distribution (would call smart contract in production)
            await this.distributeReward(walletAddress, this.rewardAmount, verificationRecord);
            
            return {
                success: true,
                message: 'Adoption verified successfully!',
                reward: this.rewardAmount,
                verificationRecord
            };
        } catch (error) {
            console.error('QR verification error:', error);
            return {
                success: false,
                message: error.message || 'Verification failed',
                error: error.toString()
            };
        }
    }

    // Manual Verification: Document upload for non-registered shelters
    async submitManualVerification(formData) {
        try {
            // Extract form data
            const { 
                adopter_name, 
                adopter_email, 
                pet_name, 
                adoption_date, 
                shelter_name, 
                shelter_contact,
                adoption_documents,
                ownership_proof,
                pet_photo
            } = formData;
            
            // Validate required fields
            if (!adopter_name || !adopter_email || !pet_name || !adoption_date || !shelter_name) {
                throw new Error('Missing required information');
            }
            
            // Validate documents
            if (!adoption_documents) {
                throw new Error('Adoption documents are required');
            }
            
            // Get connected wallet
            const walletAddress = DazeeWallet.getWalletAddress();
            if (!walletAddress) {
                throw new Error('No wallet connected');
            }
            
            // Generate unique verification ID
            const verificationId = this.generateVerificationId();
            
            // Create pending verification record
            const pendingVerification = {
                verificationId,
                adopter_name,
                adopter_email,
                pet_name,
                adoption_date,
                shelter_name,
                shelter_contact,
                has_documents: !!adoption_documents,
                has_ownership_proof: !!ownership_proof,
                has_pet_photo: !!pet_photo,
                walletAddress,
                submission_date: new Date().toISOString(),
                status: 'pending',
                rewardAmount: this.rewardAmount
            };
            
            // Add to pending verifications
            this.pendingVerifications.push(pendingVerification);
            this.saveData();
            
            // In a real implementation, we would upload documents to secure storage
            // and trigger AI verification or manual review process
            
            // For demo purposes, we'll simulate the verification process
            this.simulateVerificationProcess(verificationId);
            
            return {
                success: true,
                message: 'Verification submitted successfully!',
                pendingVerification,
                estimatedTime: '24-48 hours'
            };
        } catch (error) {
            console.error('Manual verification submission error:', error);
            return {
                success: false,
                message: error.message || 'Submission failed',
                error: error.toString()
            };
        }
    }

    // Simulate the verification process (for demo purposes)
    simulateVerificationProcess(verificationId) {
        // Find the pending verification
        const pendingIndex = this.pendingVerifications.findIndex(v => v.verificationId === verificationId);
        
        if (pendingIndex === -1) {
            console.error('Verification not found:', verificationId);
            return;
        }
        
        // Update status to 'processing'
        this.pendingVerifications[pendingIndex].status = 'processing';
        this.pendingVerifications[pendingIndex].processing_date = new Date().toISOString();
        this.saveData();
        
        // Simulate AI/manual verification (80% success rate)
        const willVerify = Math.random() < 0.8;
        
        // Set timeout to simulate processing time (10-20 seconds for demo)
        const processingTime = 10000 + Math.random() * 10000;
        
        setTimeout(() => {
            if (willVerify) {
                // Verification successful
                const verifiedRecord = {
                    ...this.pendingVerifications[pendingIndex],
                    status: 'verified',
                    verification_date: new Date().toISOString()
                };
                
                // Remove from pending and add to verified
                this.pendingVerifications.splice(pendingIndex, 1);
                this.verifiedAdoptions.push(verifiedRecord);
                this.saveData();
                
                // Distribute reward
                this.distributeReward(
                    verifiedRecord.walletAddress, 
                    verifiedRecord.rewardAmount, 
                    verifiedRecord
                );
                
                // Trigger notification
                this.notifyUser(verifiedRecord.adopter_email, 'verification_approved', verifiedRecord);
            } else {
                // Verification failed
                this.pendingVerifications[pendingIndex].status = 'rejected';
                this.pendingVerifications[pendingIndex].rejection_date = new Date().toISOString();
                this.pendingVerifications[pendingIndex].rejection_reason = 'Documents could not be verified';
                this.saveData();
                
                // Trigger notification
                this.notifyUser(
                    this.pendingVerifications[pendingIndex].adopter_email, 
                    'verification_rejected', 
                    this.pendingVerifications[pendingIndex]
                );
            }
        }, processingTime);
    }

    // Helper methods
    isValidQrFormat(qrData) {
        try {
            const data = JSON.parse(qrData);
            return data.adoptionId && data.shelterId && data.timestamp && data.signature;
        } catch {
            return false;
        }
    }
    
    isQrCodeUsed(adoptionId) {
        return this.verifiedAdoptions.some(v => v.adoptionId === adoptionId);
    }
    
    async verifyShelter(shelterId) {
        // In production, this would check against the blockchain or API
        // For demo, we'll use a mock list of registered shelters
        const registeredShelters = [
            'shelter_001', 'shelter_002', 'shelter_003', 
            'shelter_004', 'shelter_005', 'shelter_006'
        ];
        
        return registeredShelters.includes(shelterId);
    }
    
    async verifySignature(adoptionId, shelterId, timestamp, signature) {
        // In production, this would verify the cryptographic signature
        // For demo, we'll return true
        return true;
    }
    
    generateVerificationId() {
        return 'verify_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    }
    
    async distributeReward(walletAddress, amount, verificationRecord) {
        // In production, this would call the smart contract to distribute tokens
        console.log(`Distributing ${amount} DazeeCoin to ${walletAddress}`);
        
        // For demo, we'll just simulate the transaction
        const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Create transaction record
        const txRecord = {
            txHash,
            walletAddress,
            amount,
            timestamp: new Date().toISOString(),
            verificationRecord
        };
        
        // Trigger notification
        this.notifyUser(verificationRecord.adopter_email || '', 'reward_sent', {
            ...verificationRecord,
            txHash,
            amount
        });
        
        return txRecord;
    }
    
    notifyUser(email, type, data) {
        // In production, this would send emails, push notifications, etc.
        console.log(`Notification to ${email} of type ${type}:`, data);
        
        // For demo, we'll dispatch an event that the UI can listen for
        const event = new CustomEvent('dazeechain_notification', {
            detail: {
                type,
                data,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // Get pending verifications for current user
    getPendingVerifications() {
        const walletAddress = DazeeWallet.getWalletAddress();
        if (!walletAddress) return [];
        
        return this.pendingVerifications.filter(v => v.walletAddress === walletAddress);
    }
    
    // Get verified adoptions for current user
    getVerifiedAdoptions() {
        const walletAddress = DazeeWallet.getWalletAddress();
        if (!walletAddress) return [];
        
        return this.verifiedAdoptions.filter(v => v.walletAddress === walletAddress);
    }
}

// Initialize the verification system
const adoptionVerifier = new AdoptionVerificationSystem();

// Handle QR code scanning
function handleQrScan(qrData) {
    adoptionVerifier.verifyQrCode(qrData)
        .then(result => {
            if (result.success) {
                showSuccessMessage(`Verification successful! ${result.reward} DazeeCoin has been sent to your wallet.`);
            } else {
                showErrorMessage(`Verification failed: ${result.message}`);
            }
        })
        .catch(error => {
            showErrorMessage(`Error: ${error.message}`);
        });
}

// Handle form submission for manual verification
function handleManualSubmission(formElement) {
    const formData = new FormData(formElement);
    const formDataObj = {};
    
    for (const [key, value] of formData.entries()) {
        formDataObj[key] = value;
    }
    
    adoptionVerifier.submitManualVerification(formDataObj)
        .then(result => {
            if (result.success) {
                showSuccessMessage(`Verification submitted successfully! We'll review your documents within ${result.estimatedTime}.`);
                formElement.reset();
            } else {
                showErrorMessage(`Submission failed: ${result.message}`);
            }
        })
        .catch(error => {
            showErrorMessage(`Error: ${error.message}`);
        });
    
    return false; // Prevent form submission
}

// UI Helper functions
function showSuccessMessage(message) {
    const notificationArea = document.getElementById('notificationArea');
    if (notificationArea) {
        notificationArea.innerHTML = `
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
                <div class="flex items-center">
                    <div class="py-1"><i class="fas fa-check-circle text-green-500 mr-2"></i></div>
                    <div>${message}</div>
                </div>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notificationArea.innerHTML = '';
        }, 5000);
    } else {
        alert(message);
    }
}

function showErrorMessage(message) {
    const notificationArea = document.getElementById('notificationArea');
    if (notificationArea) {
        notificationArea.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
                <div class="flex items-center">
                    <div class="py-1"><i class="fas fa-exclamation-circle text-red-500 mr-2"></i></div>
                    <div>${message}</div>
                </div>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notificationArea.innerHTML = '';
        }, 5000);
    } else {
        alert(message);
    }
}

// Listen for notifications
document.addEventListener('dazeechain_notification', function(event) {
    const { type, data } = event.detail;
    
    switch(type) {
        case 'verification_approved':
            showSuccessMessage(`Your adoption of ${data.pet_name} has been verified! ${data.rewardAmount} DazeeCoin will be sent to your wallet shortly.`);
            break;
        case 'verification_rejected':
            showErrorMessage(`Verification for ${data.pet_name} was rejected: ${data.rejection_reason}. Please contact support for assistance.`);
            break;
        case 'reward_sent':
            showSuccessMessage(`${data.amount} DazeeCoin has been sent to your wallet for adopting ${data.pet_name}!`);
            break;
    }
});

// Export for use in other files
window.DazeeChainAdoption = {
    verifier: adoptionVerifier,
    handleQrScan,
    handleManualSubmission
};
