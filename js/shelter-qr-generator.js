// DazeeChain Shelter QR Code Generator
class ShelterQrGenerator {
    constructor(shelterId, shelterName, privateKey) {
        this.shelterId = shelterId;
        this.shelterName = shelterName;
        this.privateKey = privateKey; // In production, this would be securely stored
    }
    
    // Generate a QR code for a new adoption
    async generateAdoptionQR(petName, adopterName, adopterEmail) {
        try {
            // Generate a unique adoption ID
            const adoptionId = this.generateAdoptionId(petName);
            
            // Current timestamp
            const timestamp = Date.now();
            
            // Create the data object
            const qrData = {
                adoptionId,
                shelterId: this.shelterId,
                shelterName: this.shelterName,
                petName,
                adopterName,
                adopterEmail,
                timestamp,
                signature: this.generateSignature(adoptionId, timestamp)
            };
            
            // Convert to JSON string
            const qrDataString = JSON.stringify(qrData);
            
            // In a real implementation, we would generate an actual QR code image
            // For this demo, we'll just return the data string that would be encoded
            return {
                qrDataString,
                adoptionId,
                timestamp,
                qrImageUrl: this.getQrImageUrl(qrDataString)
            };
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }
    
    // Generate a unique adoption ID
    generateAdoptionId(petName) {
        const normalizedPetName = petName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomString = Math.random().toString(36).substring(2, 10);
        const timestamp = Date.now().toString(36);
        
        return `${this.shelterId}_${normalizedPetName}_${randomString}_${timestamp}`;
    }
    
    // Generate a cryptographic signature
    // In production, this would use proper cryptographic signing
    generateSignature(adoptionId, timestamp) {
        // This is a simplified mock signature
        // In production, this would use proper cryptographic signing with the shelter's private key
        const dataToSign = `${adoptionId}:${this.shelterId}:${timestamp}`;
        
        // Mock signature (in production, use proper crypto library)
        return '0x' + Array.from(dataToSign).reduce(
            (hash, char) => (((hash << 5) - hash) + char.charCodeAt(0)) & 0xFFFFFFFF, 
            0
        ).toString(16).padStart(8, '0') + this.privateKey.substring(2, 10);
    }
    
    // Get a QR code image URL (using a third-party QR code generator service)
    getQrImageUrl(data) {
        // Encode the data for URL
        const encodedData = encodeURIComponent(data);
        
        // Use a QR code generation service (for demo purposes)
        // In production, you might want to generate these on your own server
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
    }
    
    // Generate a printable adoption certificate with QR code
    async generateAdoptionCertificate(petName, adopterName, adoptionDate) {
        // Generate the QR code first
        const qrResult = await this.generateAdoptionQR(petName, adopterName, '');
        
        // Format the adoption date
        const formattedDate = new Date(adoptionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create certificate HTML
        const certificateHtml = `
            <div class="adoption-certificate">
                <div class="certificate-header">
                    <h1>Certificate of Adoption</h1>
                    <h2>${this.shelterName}</h2>
                </div>
                
                <div class="certificate-content">
                    <p>This certifies that</p>
                    <h3>${adopterName}</h3>
                    <p>has adopted</p>
                    <h3>${petName}</h3>
                    <p>on</p>
                    <h3>${formattedDate}</h3>
                </div>
                
                <div class="certificate-footer">
                    <div class="qr-code">
                        <img src="${qrResult.qrImageUrl}" alt="DazeeChain Verification QR Code">
                        <p>Scan to claim your DazeeCoin reward!</p>
                    </div>
                    
                    <div class="certificate-signature">
                        <p>Authorized by: ${this.shelterName}</p>
                        <p>Adoption ID: ${qrResult.adoptionId}</p>
                    </div>
                </div>
            </div>
        `;
        
        return {
            certificateHtml,
            qrData: qrResult
        };
    }
}

// Shelter dashboard functions
function initializeShelterDashboard(shelterId, shelterName, privateKey) {
    // Create the QR generator
    const qrGenerator = new ShelterQrGenerator(shelterId, shelterName, privateKey);
    
    // Store in global scope for access from UI
    window.shelterQrGenerator = qrGenerator;
    
    // Update UI elements
    const shelterNameElements = document.querySelectorAll('.shelter-name');
    shelterNameElements.forEach(el => {
        el.textContent = shelterName;
    });
    
    return qrGenerator;
}

// Generate QR code from form data
async function generateQrFromForm(formElement) {
    try {
        // Get form data
        const petName = formElement.querySelector('[name="pet_name"]').value;
        const adopterName = formElement.querySelector('[name="adopter_name"]').value;
        const adopterEmail = formElement.querySelector('[name="adopter_email"]').value;
        
        if (!petName || !adopterName) {
            throw new Error('Pet name and adopter name are required');
        }
        
        // Generate QR code
        const qrResult = await window.shelterQrGenerator.generateAdoptionQR(
            petName,
            adopterName,
            adopterEmail
        );
        
        // Display the QR code
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="qr-result">
                    <h3>Adoption QR Code for ${petName}</h3>
                    <div class="qr-image">
                        <img src="${qrResult.qrImageUrl}" alt="Adoption QR Code">
                    </div>
                    <p>Adoption ID: ${qrResult.adoptionId}</p>
                    <div class="qr-instructions">
                        <p>Instructions for the adopter:</p>
                        <ol>
                            <li>Scan this QR code with the DazeeChain app</li>
                            <li>Connect your wallet</li>
                            <li>Receive 100 DazeeCoin instantly!</li>
                        </ol>
                    </div>
                    <button class="print-qr-btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Print QR Code
                    </button>
                    <button class="generate-certificate-btn" onclick="generateCertificate('${petName}', '${adopterName}', '${new Date().toISOString()}')">
                        <i class="fas fa-certificate"></i> Generate Adoption Certificate
                    </button>
                </div>
            `;
        }
        
        return qrResult;
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert(`Error: ${error.message}`);
    }
}

// Generate and display adoption certificate
async function generateCertificate(petName, adopterName, adoptionDate) {
    try {
        // Generate certificate
        const certificateResult = await window.shelterQrGenerator.generateAdoptionCertificate(
            petName,
            adopterName,
            adoptionDate
        );
        
        // Open certificate in new window for printing
        const certificateWindow = window.open('', '_blank');
        certificateWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Adoption Certificate - ${petName}</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f9f9f9;
                        margin: 0;
                        padding: 20px;
                    }
                    
                    .adoption-certificate {
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px;
                        background-color: #fff;
                        border: 10px solid #ff6b35;
                        border-radius: 10px;
                        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                    }
                    
                    .certificate-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    
                    .certificate-header h1 {
                        color: #ff6b35;
                        font-size: 36px;
                        margin-bottom: 10px;
                    }
                    
                    .certificate-header h2 {
                        color: #333;
                        font-size: 24px;
                    }
                    
                    .certificate-content {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    
                    .certificate-content p {
                        color: #666;
                        margin: 5px 0;
                    }
                    
                    .certificate-content h3 {
                        color: #333;
                        font-size: 28px;
                        margin: 10px 0;
                    }
                    
                    .certificate-footer {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 40px;
                    }
                    
                    .qr-code {
                        text-align: center;
                    }
                    
                    .qr-code img {
                        width: 150px;
                        height: 150px;
                        border: 1px solid #ddd;
                    }
                    
                    .qr-code p {
                        font-size: 14px;
                        color: #ff6b35;
                        margin-top: 10px;
                    }
                    
                    .certificate-signature {
                        text-align: right;
                    }
                    
                    .certificate-signature p {
                        margin: 5px 0;
                        color: #666;
                    }
                    
                    @media print {
                        body {
                            background-color: #fff;
                        }
                        
                        .adoption-certificate {
                            box-shadow: none;
                        }
                        
                        .print-button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                ${certificateResult.certificateHtml}
                <div class="print-button" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background-color: #ff6b35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Print Certificate
                    </button>
                </div>
            </body>
            </html>
        `);
        certificateWindow.document.close();
    } catch (error) {
        console.error('Error generating certificate:', error);
        alert(`Error: ${error.message}`);
    }
}

// Export for use in other files
window.DazeeChainShelter = {
    ShelterQrGenerator,
    initializeShelterDashboard,
    generateQrFromForm,
    generateCertificate
};
