// QR Code Generator
class QRCodeGenerator {
    static async generateQR(data) {
        const qr = new QRCode(document.getElementById("qrcode"), {
            text: data,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        return qr;
    }

    static async generatePetProfileQR(petId) {
        const profileUrl = `https://dazeechain.com/pet/${petId}`;
        return this.generateQR(profileUrl);
    }

    static async generateRecordQR(recordId) {
        const recordUrl = `https://dazeechain.com/record/${recordId}`;
        return this.generateQR(recordUrl);
    }
}

// Vet Verification System
class VetVerification {
    static async verifyVet(license) {
        // In production, this would call an API to verify the license
        const mockVetRegistry = {
            'NY-VET-12345': {
                name: 'Dr. Sarah Smith',
                verified: true,
                specialties: ['General Practice', 'Surgery'],
                validUntil: '2026-12-31'
            }
        };
        return mockVetRegistry[license] || { verified: false };
    }

    static async requestVerification(vetData) {
        // Send verification request to the blockchain
        const verificationRequest = {
            license: vetData.license,
            name: vetData.name,
            facility: vetData.facility,
            timestamp: Date.now()
        };
        
        // In production, this would be sent to the blockchain
        console.log('Verification request sent:', verificationRequest);
        return { status: 'pending', requestId: 'VR-' + Date.now() };
    }
}

// Record Sharing System
class RecordSharing {
    static async shareWithVet(recordIds, vetLicense) {
        // Verify vet first
        const vetVerification = await VetVerification.verifyVet(vetLicense);
        if (!vetVerification.verified) {
            throw new Error('Cannot share with unverified veterinarian');
        }

        // Generate temporary access token
        const accessToken = this.generateAccessToken();

        // Create sharing record on blockchain
        const sharingRecord = {
            recordIds,
            vetLicense,
            accessToken,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };

        // In production, this would be stored on the blockchain
        console.log('Sharing record created:', sharingRecord);
        return sharingRecord;
    }

    static generateAccessToken() {
        return 'tk-' + Math.random().toString(36).substr(2, 9);
    }

    static async revokeAccess(sharingId) {
        // In production, this would revoke access on the blockchain
        console.log('Access revoked for sharing ID:', sharingId);
        return { status: 'revoked' };
    }
}

// Notification System
class PetNotifications {
    static async scheduleNotification(type, date, petId) {
        const notification = {
            type,
            date,
            petId,
            status: 'scheduled'
        };

        // In production, this would be stored in a notification service
        this.addToNotificationQueue(notification);
        return notification;
    }

    static addToNotificationQueue(notification) {
        // Mock notification queue
        const queue = JSON.parse(localStorage.getItem('notificationQueue') || '[]');
        queue.push(notification);
        localStorage.setItem('notificationQueue', JSON.stringify(queue));
    }

    static async checkUpcomingEvents(petId) {
        const events = [];
        
        // Check vaccinations
        const vaccinations = await this.getVaccinations(petId);
        for (const vax of vaccinations) {
            if (this.isUpcoming(vax.nextDue)) {
                events.push({
                    type: 'vaccination',
                    name: vax.name,
                    dueDate: vax.nextDue
                });
            }
        }

        // Check medications
        const medications = await this.getMedications(petId);
        for (const med of medications) {
            if (this.isUpcoming(med.nextRefill)) {
                events.push({
                    type: 'medication',
                    name: med.name,
                    dueDate: med.nextRefill
                });
            }
        }

        return events;
    }

    static async getVaccinations(petId) {
        // Mock vaccination data
        return [
            {
                name: 'Rabies',
                lastGiven: '2024-02-21',
                nextDue: '2025-02-21'
            },
            {
                name: 'DHPP',
                lastGiven: '2024-01-15',
                nextDue: '2025-01-15'
            }
        ];
    }

    static async getMedications(petId) {
        // Mock medication data
        return [
            {
                name: 'Heartgard Plus',
                lastRefill: '2025-02-01',
                nextRefill: '2025-03-01'
            },
            {
                name: 'NexGard',
                lastRefill: '2025-02-15',
                nextRefill: '2025-03-15'
            }
        ];
    }

    static isUpcoming(date) {
        const upcoming = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((upcoming - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 14 && diffDays >= 0; // Within next 14 days
    }
}

// Initialize features
document.addEventListener('DOMContentLoaded', async () => {
    // Generate QR code for pet profile
    const petId = document.getElementById('petProfile').dataset.petId;
    await QRCodeGenerator.generatePetProfileQR(petId);

    // Check for upcoming events
    const events = await PetNotifications.checkUpcomingEvents(petId);
    if (events.length > 0) {
        const notificationList = document.getElementById('notificationList');
        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'flex items-center space-x-2 text-sm';
            li.innerHTML = `
                <i class="fas fa-bell text-orange-500"></i>
                <span>${event.name} due on ${new Date(event.dueDate).toLocaleDateString()}</span>
            `;
            notificationList.appendChild(li);
        });
    }

    // Set up sharing buttons
    document.querySelectorAll('.share-record-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const recordId = e.target.dataset.recordId;
            const vetLicense = prompt('Enter veterinarian license number:');
            if (vetLicense) {
                try {
                    const sharingRecord = await RecordSharing.shareWithVet([recordId], vetLicense);
                    alert(`Record shared successfully. Access token: ${sharingRecord.accessToken}`);
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    });
});
