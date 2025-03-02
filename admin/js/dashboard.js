// Dashboard functionality
let currentShelterId = null;

async function loadDashboardData() {
    try {
        const [stats, shelters] = await Promise.all([
            fetch('/api/admin/stats').then(res => res.json()),
            fetch('/api/admin/shelters').then(res => res.json())
        ]);

        // Update stats
        document.getElementById('totalShelters').textContent = stats.totalShelters;
        document.getElementById('pendingShelters').textContent = stats.pendingShelters;
        document.getElementById('activeReferrals').textContent = stats.activeReferrals;
        document.getElementById('totalDocuments').textContent = stats.totalDocuments;

        // Populate shelter list
        const shelterList = document.getElementById('shelterList');
        shelterList.innerHTML = shelters.map(shelter => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${shelter.shelterName}</div>
                            <div class="text-sm text-gray-500">${shelter.ein}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${shelter.city}, ${shelter.state}</div>
                    <div class="text-sm text-gray-500">${shelter.zip}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${getStatusClass(shelter.status)}">
                        ${shelter.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${shelter.referralCount || 0}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="reviewShelter('${shelter._id}')" 
                            class="text-orange-600 hover:text-orange-900">
                        Review
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Error loading dashboard data. Please try again.');
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

async function reviewShelter(shelterId) {
    try {
        const response = await fetch(`/api/admin/shelter/${shelterId}`);
        const shelter = await response.json();
        
        currentShelterId = shelterId;
        
        // Populate modal with shelter details
        document.getElementById('shelterDetails').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Shelter Name</label>
                    <p class="mt-1 text-sm text-gray-900">${shelter.shelterName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">EIN</label>
                    <p class="mt-1 text-sm text-gray-900">${shelter.ein}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">State License</label>
                    <p class="mt-1 text-sm text-gray-900">${shelter.stateLicense}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Contact</label>
                    <p class="mt-1 text-sm text-gray-900">${shelter.email}</p>
                    <p class="mt-1 text-sm text-gray-900">${shelter.phone}</p>
                </div>
            </div>
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700">Documents</label>
                <div class="mt-1 grid grid-cols-2 gap-4">
                    ${Object.entries(shelter.documents || {}).map(([type, files]) => `
                        <div>
                            <h4 class="text-sm font-medium text-gray-700">${type}</h4>
                            ${files.map(file => `
                                <a href="${file}" target="_blank" 
                                   class="text-sm text-orange-600 hover:text-orange-900">
                                    View Document
                                </a>
                            `).join('<br>')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('approvalModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading shelter details:', error);
        alert('Error loading shelter details. Please try again.');
    }
}

async function approveShelter() {
    if (!currentShelterId) return;
    
    try {
        const response = await fetch(`/api/admin/shelter/${currentShelterId}/approve`, {
            method: 'POST'
        });
        
        if (response.ok) {
            closeModal();
            loadDashboardData();
        } else {
            throw new Error('Failed to approve shelter');
        }
    } catch (error) {
        console.error('Error approving shelter:', error);
        alert('Error approving shelter. Please try again.');
    }
}

async function rejectShelter() {
    if (!currentShelterId) return;
    
    try {
        const response = await fetch(`/api/admin/shelter/${currentShelterId}/reject`, {
            method: 'POST'
        });
        
        if (response.ok) {
            closeModal();
            loadDashboardData();
        } else {
            throw new Error('Failed to reject shelter');
        }
    } catch (error) {
        console.error('Error rejecting shelter:', error);
        alert('Error rejecting shelter. Please try again.');
    }
}

function closeModal() {
    document.getElementById('approvalModal').classList.add('hidden');
    currentShelterId = null;
}

// Load dashboard data when page loads
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Refresh data every 5 minutes
setInterval(loadDashboardData, 300000);
