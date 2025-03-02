const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = 'dazeechain';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    cachedDb = db;
    return db;
}

module.exports = { connectToDatabase };
