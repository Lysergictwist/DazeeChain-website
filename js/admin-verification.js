class AdminShelterVerification {
    /**
     * Load all pending shelter verification requests
     */
    static async loadPendingShelters() {
        try {
            // Check if user is authenticated
            if (!adminAuth || !adminAuth.isAuthenticated) {
                console.error('Admin authentication required');
                window.location.href = '../admin-login.html';
                return;
            }
            
            // Check if admin has permission to approve shelters
            if (!adminAuth.hasPermission('approve_shelters')) {
                console.error('Permission denied: approve_shelters');
                alert('You do not have permission to approve shelters');
                return;
            }
            
            // In production, this would fetch data from your API
            const pendingShelters = await this.fetchPendingShelters();
            
            const tableBody = document.getElementById('pendingSheltersList');
            const emptyState = document.getElementById('emptyState');
            
            if (pendingShelters.length === 0) {
                tableBody.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            tableBody.innerHTML = pendingShelters.map(shelter => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="text-sm font-medium text-gray-900">${shelter.name}</div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500">${new Date(shelter.submissionDate).toLocaleDateString()}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500">${shelter.ein}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500">${shelter.city}, ${shelter.state}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${this.renderAIConfidenceBadge(shelter.aiConfidence)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                            class="text-orange-600 hover:text-orange-900"
                            onclick="AdminShelterVerification.viewShelterDetails('${shelter.id}')"
                        >
                            View Details
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load pending shelters:', error);
            // Show error notification
        }
    }
    
    /**
     * Render the AI confidence level as a colored badge
     */
    static renderAIConfidenceBadge(confidence) {
        let bgColor, textColor;
        
        if (confidence >= 80) {
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
        } else if (confidence >= 60) {
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
        } else {
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
        }
        
        return `
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}">
                ${confidence}% confident
            </span>
        `;
    }
    
    /**
     * View detailed information about a specific shelter
     */
    static async viewShelterDetails(shelterId) {
        try {
            // Set the global selected shelter
            window.selectedShelterId = shelterId;
            
            // In production, fetch the shelter data from your API
            const shelterData = await this.fetchShelterById(shelterId);
            
            // Populate the modal with shelter data
            document.getElementById('modalShelterName').textContent = shelterData.name;
            document.getElementById('modalEIN').textContent = shelterData.ein;
            document.getElementById('modalStateLicense').textContent = shelterData.stateLicense;
            document.getElementById('modalUSDALicense').textContent = shelterData.usdaLicense || 'N/A';
            document.getElementById('modalYearsInOperation').textContent = `${shelterData.yearsInOperation} years`;
            document.getElementById('modalAddress').textContent = `${shelterData.address}, ${shelterData.city}, ${shelterData.state} ${shelterData.zip}`;
            document.getElementById('modalPhone').textContent = shelterData.phone;
            document.getElementById('modalEmail').textContent = shelterData.email;
            document.getElementById('modalWebsite').textContent = shelterData.website || 'N/A';
            
            // Populate references
            const referencesContainer = document.getElementById('modalReferences');
            referencesContainer.innerHTML = shelterData.references.map(ref => `
                <div class="border-l-4 border-orange-500 pl-3">
                    <p class="font-medium">${ref.name}</p>
                    <p class="text-sm text-gray-500">${ref.role}</p>
                    <p class="text-sm">${ref.contact}</p>
                </div>
            `).join('');
            
            // Populate documents
            const documentsContainer = document.getElementById('modalDocuments');
            documentsContainer.innerHTML = shelterData.documents.map(doc => `
                <div class="flex items-center">
                    <i class="fas fa-file-pdf text-red-500 mr-2"></i>
                    <a href="${doc.url}" target="_blank" class="text-blue-600 hover:underline">${doc.name}</a>
                </div>
            `).join('');
            
            // Populate AI verification
            const aiScore = shelterData.aiVerification.score;
            document.getElementById('verificationScoreValue').textContent = aiScore;
            document.getElementById('verificationScoreBar').style.width = `${aiScore}%`;
            
            if (aiScore >= 80) {
                document.getElementById('verificationScoreBar').classList.remove('bg-yellow-500', 'bg-red-500');
                document.getElementById('verificationScoreBar').classList.add('bg-green-500');
            } else if (aiScore >= 60) {
                document.getElementById('verificationScoreBar').classList.remove('bg-green-500', 'bg-red-500');
                document.getElementById('verificationScoreBar').classList.add('bg-yellow-500');
            } else {
                document.getElementById('verificationScoreBar').classList.remove('bg-green-500', 'bg-yellow-500');
                document.getElementById('verificationScoreBar').classList.add('bg-red-500');
            }
            
            const aiInsightsContainer = document.getElementById('aiInsights');
            aiInsightsContainer.innerHTML = shelterData.aiVerification.insights.map(insight => `
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="fas fa-${insight.sentiment === 'positive' ? 'check text-green-500' : 
                                        insight.sentiment === 'neutral' ? 'info-circle text-blue-500' : 
                                        'exclamation-triangle text-red-500'} mt-1"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm">${insight.message}</p>
                    </div>
                </div>
            `).join('');
            
            // Show the modal
            document.getElementById('shelterDetailModal').classList.remove('hidden');
        } catch (error) {
            console.error('Failed to load shelter details:', error);
            // Show error notification
        }
    }
    
    /**
     * Approve a shelter after verification
     */
    static async approveShelter(shelterId) {
        try {
            // Check if user is authenticated
            if (!adminAuth || !adminAuth.isAuthenticated) {
                console.error('Admin authentication required');
                window.location.href = '../admin-login.html';
                return;
            }
            
            // Check if admin has permission to approve shelters
            if (!adminAuth.hasPermission('approve_shelters')) {
                console.error('Permission denied: approve_shelters');
                alert('You do not have permission to approve shelters');
                return;
            }
            
            // In production, call your API to approve the shelter
            await this.updateShelterStatus(shelterId, 'approved');
            
            // Close modal
            document.getElementById('shelterDetailModal').classList.add('hidden');
            
            // Reload the list
            this.loadPendingShelters();
            
            // Show success notification
            alert('Shelter approved successfully');
        } catch (error) {
            console.error('Failed to approve shelter:', error);
            // Show error notification
        }
    }
    
    /**
     * Request more information from the shelter
     */
    static async requestMoreInfo(shelterId) {
        try {
            // Check if user is authenticated
            if (!adminAuth || !adminAuth.isAuthenticated) {
                console.error('Admin authentication required');
                window.location.href = '../admin-login.html';
                return;
            }
            
            // Check if admin has permission to request more information
            if (!adminAuth.hasPermission('request_more_info')) {
                console.error('Permission denied: request_more_info');
                alert('You do not have permission to request more information');
                return;
            }
            
            // In production, call your API to request more information
            const additionalInfo = prompt('What additional information do you need?');
            if (!additionalInfo) return;
            
            await this.updateShelterStatus(shelterId, 'info_requested', { message: additionalInfo });
            
            // Close modal
            document.getElementById('shelterDetailModal').classList.add('hidden');
            
            // Reload the list
            this.loadPendingShelters();
            
            // Show success notification
            alert('Information request sent successfully');
        } catch (error) {
            console.error('Failed to request more information:', error);
            // Show error notification
        }
    }
    
    /**
     * Reject a shelter's verification request
     */
    static async rejectShelter(shelterId) {
        try {
            // Check if user is authenticated
            if (!adminAuth || !adminAuth.isAuthenticated) {
                console.error('Admin authentication required');
                window.location.href = '../admin-login.html';
                return;
            }
            
            // Check if admin has permission to reject shelters
            if (!adminAuth.hasPermission('reject_shelters')) {
                console.error('Permission denied: reject_shelters');
                alert('You do not have permission to reject shelters');
                return;
            }
            
            // In production, call your API to reject the shelter
            const reason = prompt('Please provide a reason for rejection:');
            if (!reason) return;
            
            await this.updateShelterStatus(shelterId, 'rejected', { reason });
            
            // Close modal
            document.getElementById('shelterDetailModal').classList.add('hidden');
            
            // Reload the list
            this.loadPendingShelters();
            
            // Show success notification
            alert('Shelter rejected successfully');
        } catch (error) {
            console.error('Failed to reject shelter:', error);
            // Show error notification
        }
    }
    
    /**
     * Toggle AI assistance for verification
     */
    static toggleAIAssistance(enabled) {
        // In production, update the setting in your API/database
        console.log(`AI assistance ${enabled ? 'enabled' : 'disabled'}`);
        // Potentially reload the list with updated AI insights
        this.loadPendingShelters();
    }
    
    /* API CALLS - These would connect to your backend in production */
    
    static async fetchPendingShelters() {
        // In production, this would be an API call
        // For now, return mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        return [
            {
                id: 'shelter1',
                name: 'Happy Paws Rescue',
                submissionDate: '2025-02-28T10:30:00Z',
                ein: '12-3456789',
                city: 'San Francisco',
                state: 'CA',
                aiConfidence: 85
            },
            {
                id: 'shelter2',
                name: 'Second Chance Animal Shelter',
                submissionDate: '2025-03-01T14:45:00Z',
                ein: '98-7654321',
                city: 'Austin',
                state: 'TX',
                aiConfidence: 75
            },
            {
                id: 'shelter3',
                name: 'Paws & Claws Rescue Center',
                submissionDate: '2025-03-02T09:15:00Z',
                ein: '45-6789123',
                city: 'Portland',
                state: 'OR',
                aiConfidence: 55
            }
        ];
    }
    
    static async fetchShelterById(shelterId) {
        // In production, this would be an API call
        // For now, return mock data based on ID
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        const shelters = {
            'shelter1': {
                id: 'shelter1',
                name: 'Happy Paws Rescue',
                ein: '12-3456789',
                stateLicense: 'CA-SHL-12345',
                usdaLicense: 'USDA-ANM-7890',
                yearsInOperation: 8,
                address: '123 Rescue Lane',
                city: 'San Francisco',
                state: 'CA',
                zip: '94105',
                phone: '(415) 555-7890',
                email: 'contact@happypawsrescue.org',
                website: 'www.happypawsrescue.org',
                references: [
                    {
                        name: 'Dr. Sarah Johnson',
                        role: 'Veterinarian',
                        contact: 'sjohnson@petclinic.com'
                    },
                    {
                        name: 'Bay Area Animal Alliance',
                        role: 'Partner Organization',
                        contact: 'partnerships@baaa.org'
                    }
                ],
                documents: [
                    {
                        name: '501(c)(3) Certificate',
                        url: '#tax-exempt-doc'
                    },
                    {
                        name: 'State License',
                        url: '#state-license-doc'
                    },
                    {
                        name: 'Facility Photos',
                        url: '#facility-photos'
                    }
                ],
                aiVerification: {
                    score: 85,
                    insights: [
                        {
                            sentiment: 'positive',
                            message: 'Tax-exempt status verified with IRS database'
                        },
                        {
                            sentiment: 'positive',
                            message: 'Website shows consistent activity for over 5 years'
                        },
                        {
                            sentiment: 'neutral',
                            message: 'Social media presence is moderate with regular posts'
                        },
                        {
                            sentiment: 'positive',
                            message: 'Veterinary references checked and validated'
                        }
                    ]
                }
            },
            'shelter2': {
                id: 'shelter2',
                name: 'Second Chance Animal Shelter',
                ein: '98-7654321',
                stateLicense: 'TX-SH-54321',
                usdaLicense: '',
                yearsInOperation: 3,
                address: '456 Adoption Avenue',
                city: 'Austin',
                state: 'TX',
                zip: '78701',
                phone: '(512) 555-4321',
                email: 'info@secondchanceanimals.org',
                website: 'www.secondchanceanimals.org',
                references: [
                    {
                        name: 'Dr. Michael Rodriguez',
                        role: 'Veterinarian',
                        contact: 'mrodriguez@vetclinic.com'
                    },
                    {
                        name: 'Austin Pets Alive',
                        role: 'Partner Organization',
                        contact: 'partners@austinpetsalive.org'
                    }
                ],
                documents: [
                    {
                        name: '501(c)(3) Certificate',
                        url: '#tax-exempt-doc'
                    },
                    {
                        name: 'State License',
                        url: '#state-license-doc'
                    },
                    {
                        name: 'Annual Report',
                        url: '#annual-report'
                    }
                ],
                aiVerification: {
                    score: 75,
                    insights: [
                        {
                            sentiment: 'positive',
                            message: 'Tax-exempt status verified with IRS database'
                        },
                        {
                            sentiment: 'neutral',
                            message: 'Website was created recently (3 years ago)'
                        },
                        {
                            sentiment: 'neutral',
                            message: 'Limited online reviews but all positive'
                        },
                        {
                            sentiment: 'negative',
                            message: 'One veterinary reference could not be immediately verified'
                        }
                    ]
                }
            },
            'shelter3': {
                id: 'shelter3',
                name: 'Paws & Claws Rescue Center',
                ein: '45-6789123',
                stateLicense: 'OR-ANM-67890',
                usdaLicense: '',
                yearsInOperation: 1,
                address: '789 Animal Way',
                city: 'Portland',
                state: 'OR',
                zip: '97201',
                phone: '(503) 555-6789',
                email: 'help@pawsandclaws.org',
                website: '',
                references: [
                    {
                        name: 'Dr. Lisa Thompson',
                        role: 'Veterinarian',
                        contact: 'lthompson@animalcare.com'
                    }
                ],
                documents: [
                    {
                        name: '501(c)(3) Application',
                        url: '#tax-exempt-app'
                    },
                    {
                        name: 'State License',
                        url: '#state-license-doc'
                    }
                ],
                aiVerification: {
                    score: 55,
                    insights: [
                        {
                            sentiment: 'negative',
                            message: 'Tax-exempt status pending; application in process'
                        },
                        {
                            sentiment: 'negative',
                            message: 'No website or social media presence detected'
                        },
                        {
                            sentiment: 'neutral',
                            message: 'Recently established organization (< 1 year)'
                        },
                        {
                            sentiment: 'negative',
                            message: 'Only one veterinary reference provided'
                        },
                        {
                            sentiment: 'negative',
                            message: 'Address appears to be a residential location'
                        }
                    ]
                }
            }
        };
        
        return shelters[shelterId] || null;
    }
    
    static async updateShelterStatus(shelterId, status, details = {}) {
        // In production, this would be an API call
        // For now, just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Updated shelter ${shelterId} status to ${status}`, details);
        return true;
    }
}

// Make the class available globally
window.AdminShelterVerification = AdminShelterVerification;
