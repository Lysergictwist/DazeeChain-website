const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = await connectToDatabase();
        const shelters = db.collection('shelters');

        // Get total count of registered shelters
        const count = await shelters.countDocuments();

        return res.status(200).json({ count });
    } catch (error) {
        console.error('Error fetching shelter count:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
