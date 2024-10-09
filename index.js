const express = require('express');
const multer = require('multer');
const { ShareServiceClient } = require('@azure/storage-file-share');
const { BlobServiceClient } = require('@azure/storage-blob');
const { Readable } = require('stream');
const path = require('path');
require('dotenv').config(); // Ensure you have the connection string in your .env file

const app = express();

// Serve the HTML form when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Set up Multer to handle multipart/form-data without storing the files on disk
const storage = multer.memoryStorage(); // Store file data in memory
const upload = multer({ storage }).fields([ // Corrected multer() usage
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]);

// Initialize ShareServiceClient using the connection string from environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING; // Ensure this is correctly set in your .env file
const shareName = "files"; // Replace with your Azure File Share name
const containerName = "images"; // Replace with your Azure Storage container name

const serviceClient = ShareServiceClient.fromConnectionString(connectionString);
const shareClient = serviceClient.getShareClient(shareName);
const directoryClient = shareClient.getDirectoryClient(""); // Use your container name

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

app.post('/upload', upload, async (req, res) => {
    try {
        // Get file buffers from the request


        const imageBuffer = req.files['image'][0].buffer; // Buffer for image
        const fileBuffer = req.files['file'][0].buffer; // Buffer for file
        const imageName = req.files['image'][0].originalname; // Image file name
        const fileName = req.files['file'][0].originalname; // File name

        // Upload image to Blob Storage
        const blockBlobClientImage = containerClient.getBlockBlobClient(imageName);
        await blockBlobClientImage.uploadData(imageBuffer);

        // Upload regular file
        const fileClient = directoryClient.getFileClient(fileName);
        const fileStream = Readable.from(fileBuffer);
        await fileClient.create(fileBuffer.length);
        await fileClient.uploadStream(fileStream, fileBuffer.length, 4 * 1024 * 1024);

        res.send('Files uploaded successfully to Azure Storage');
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).send('File upload failed');
    }
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
