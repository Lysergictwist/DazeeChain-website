class AdoptionQR {
    constructor(provider, adoptionRewardsAddress) {
        this.provider = provider;
        this.adoptionRewards = new ethers.Contract(
            adoptionRewardsAddress,
            [
                'function generateAdoptionCodeHash(address, string, uint256) pure returns (bytes32)',
                'function isCodeValid(bytes32) view returns (bool)',
                'function getAdoptionDetails(bytes32) view returns (address, uint256, bool, bool, address)'
            ],
            provider
        );
    }

    /**
     * Generates a unique adoption code and QR data
     * @param {string} shelterAddress - Address of the verified shelter
     * @param {string} petId - Unique identifier for the pet
     * @returns {Object} QR code data and code hash
     */
    async generateAdoptionQR(shelterAddress, petId) {
        const timestamp = Math.floor(Date.now() / 1000);
        const codeHash = await this.adoptionRewards.generateAdoptionCodeHash(
            shelterAddress,
            petId,
            timestamp
        );

        // Create QR code data
        const qrData = {
            type: 'dazee-adoption',
            shelter: shelterAddress,
            petId: petId,
            timestamp: timestamp,
            codeHash: codeHash
        };

        return {
            qrData: JSON.stringify(qrData),
            codeHash: codeHash,
            expirationDate: new Date(timestamp * 1000 + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };
    }

    /**
     * Validates an adoption code
     * @param {string} codeHash - Hash of the adoption code
     * @returns {Object} Validation result and adoption details
     */
    async validateAdoptionCode(codeHash) {
        const isValid = await this.adoptionRewards.isCodeValid(codeHash);
        if (!isValid) {
            return { isValid: false, message: 'Invalid or expired code' };
        }

        const [shelter, timestamp, isUsed, isConfirmed, adopter] = 
            await this.adoptionRewards.getAdoptionDetails(codeHash);

        return {
            isValid: true,
            details: {
                shelter,
                timestamp: new Date(timestamp * 1000),
                isUsed,
                isConfirmed,
                adopter,
                isExpired: Date.now() > timestamp * 1000 + 30 * 24 * 60 * 60 * 1000
            }
        };
    }

    /**
     * Generates a QR code SVG
     * @param {string} qrData - Data to encode in QR code
     * @returns {string} SVG string
     */
    generateQRSvg(qrData) {
        // Note: In production, use a QR code library like qrcode-generator
        // This is a placeholder implementation
        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white"/>
                <text x="50" y="50" text-anchor="middle">QR Code Placeholder</text>
            </svg>
        `;
    }

    /**
     * Creates a printable adoption certificate with QR code
     * @param {Object} adoptionData - Adoption details
     * @param {string} qrSvg - QR code SVG
     * @returns {string} HTML string for the certificate
     */
    generateAdoptionCertificate(adoptionData, qrSvg) {
        return `
            <div class="adoption-certificate">
                <h1>DazeeChain Adoption Certificate</h1>
                <div class="qr-code">${qrSvg}</div>
                <div class="details">
                    <p>Shelter: ${adoptionData.shelter}</p>
                    <p>Pet ID: ${adoptionData.petId}</p>
                    <p>Valid Until: ${adoptionData.expirationDate.toLocaleDateString()}</p>
                    <p class="warning">
                        Scan this QR code within 30 days of adoption to receive your DZ reward!
                    </p>
                </div>
            </div>
        `;
    }
}
