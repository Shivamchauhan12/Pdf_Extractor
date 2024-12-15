const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Route=require('./Routes/Route')
require('dotenv').config();

const path = require('path');
const cors = require('cors');

const app = express();
const port =  process.env.PORT || 5000;

// Use CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file upload
const upload = multer({ dest: 'uploads/' });

// Ensure the extracted directory exists
const extractedDir = path.join(__dirname, 'extracted');
if (!fs.existsSync(extractedDir)) {
    fs.mkdirSync(extractedDir);
}

app.use("/api/pdf",upload.single('file'),Route);
 
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
