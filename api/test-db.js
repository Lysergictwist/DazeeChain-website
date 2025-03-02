const { connectToDatabase } = require('./db');

module.exports = async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('shelters');
        
        // Try to insert a test document
        const testDoc = {
            shelterName: 'Test Shelter',
            timestamp: new Date(),
            test: true
        };
        
        await collection.insertOne(testDoc);
        
        // Retrieve the test document
        const result = await collection.findOne({ test: true });
        
        // Delete the test document
        await collection.deleteOne({ test: true });
        
        res.status(200).json({ 
            success: true, 
            message: 'Database connection successful',
            testResult: result 
        });
        
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
