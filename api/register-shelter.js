const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = await connectToDatabase();
        const shelters = db.collection('shelters');

        const {
            shelterName,
            ein,
            stateLicense,
            usdaLicense,
            address,
            city,
            state,
            zip,
            phone,
            email,
            website,
            socialMedia,
            referralCode
        } = req.body;

        // Basic validation
        if (!shelterName || !ein || !stateLicense || !address || !city || !state || !zip || !phone || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for existing shelter with same EIN
        const existingShelter = await shelters.findOne({ ein });
        if (existingShelter) {
            return res.status(409).json({ error: 'A shelter with this EIN already exists' });
        }

        // Create shelter record
        const shelter = {
            shelterName,
            ein,
            stateLicense,
            usdaLicense,
            address,
            city,
            state,
            zip,
            phone,
            email,
            website,
            socialMedia,
            referralCode,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert shelter and track referral
        const result = await shelters.insertOne(shelter);

        // If there's a referral code, update referral count
        if (referralCode) {
            await shelters.updateOne(
                { referralCode: referralCode },
                { $inc: { referralCount: 1 } }
            );
        }

        // Generate unique referral code for the new shelter
        const newReferralCode = generateReferralCode(result.insertedId);
        await shelters.updateOne(
            { _id: result.insertedId },
            { 
                $set: { 
                    referralCode: newReferralCode,
                    referralCount: 0
                }
            }
        );

        return res.status(201).json({
            success: true,
            message: 'Shelter registration submitted successfully',
            referralCode: newReferralCode
        });

    } catch (error) {
        console.error('Shelter registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

function generateReferralCode(id) {
    // Generate a unique referral code using shelter ID and timestamp
    const timestamp = Date.now().toString(36);
    const idString = id.toString().substr(-4);
    return `DZ${timestamp}${idString}`.toUpperCase();
}
