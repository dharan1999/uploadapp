// const express = require('express')
// const app = express()

// app.use(express.static('public'))
// const PORT = 8080

// app.listen(PORT ,() => console.log( `Server is running on http://localhost:${PORT}`));

const express = require('express');
const multer = require('multer');
// const { listBlobImages } = require('./services/listBlobImages');
const { BlobServiceClient } = require('@azure/storage-blob');
const { ShareServiceClient } = require('@azure/storage-file-share'); // Import ShareServiceClient
require('dotenv').config();

const app = express();
const port = 8080;

// Azure Storage Account Configurations
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobContainerName = 'images'; // Replace with your container name
const fileShareName = 'files'; // Replace with your file share name

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const shareServiceClient = ShareServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING); // Use ShareServiceClient for File Shares

const upload = multer({ dest: 'uploads/' }); // Local folder for file uploads

app.use(express.static('public'));

// Endpoint to handle file uploads
app.post('/upload', upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res) => {
    try {
        // Upload image to Blob Storage
        const blobContainerClient = blobServiceClient.getContainerClient(blobContainerName);
        const imageBlobClient = blobContainerClient.getBlockBlobClient(req.files['image'][0].originalname);
        await imageBlobClient.uploadFile(req.files['image'][0].path);

        // Upload file to File Share
        const fileShareClient = shareServiceClient.getShareClient(fileShareName);
        const directoryClient = fileShareClient.getDirectoryClient('');
        const fileClient = directoryClient.getFileClient(req.files['file'][0].originalname);
        await fileClient.uploadFile(req.files['file'][0].path);

        res.status(200).send('Files uploaded successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading files');
    }
});




// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
