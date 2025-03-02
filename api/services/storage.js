const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_BUCKET_NAME;

async function uploadFile(file, shelterId, documentType) {
    const fileExtension = file.name.split('.').pop();
    const key = `shelters/${shelterId}/${documentType}/${uuidv4()}.${fileExtension}`;

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'private'
    };

    try {
        await s3.upload(params).promise();
        return key;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function getSignedUrl(key) {
    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 3600 // URL expires in 1 hour
    };

    try {
        return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
}

async function deleteFile(key) {
    const params = {
        Bucket: bucketName,
        Key: key
    };

    try {
        await s3.deleteObject(params).promise();
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

module.exports = {
    uploadFile,
    getSignedUrl,
    deleteFile
};
