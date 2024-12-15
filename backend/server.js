const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 5000;

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

// Function to parse page ranges like "1-3,5,7"
function parsePageRanges(input, totalPages) {
    const pages = new Set(); // Use Set to avoid duplicates
    const parts = input.split(',');

    for (const part of parts) {
        if (part.includes('-')) {
            // Handle range, e.g., "1-3"
            const [start, end] = part.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
                throw new Error(`Invalid page range: ${part}`);
            }
            for (let i = start; i <= end; i++) {
                pages.add(i - 1); // Convert to 0-based index
            }
        } else {
            // Handle individual page, e.g., "5"
            const page = parseInt(part, 10);
            if (isNaN(page) || page < 1 || page > totalPages) {
                throw new Error(`Invalid page number: ${part}`);
            }
            pages.add(page - 1); // Convert to 0-based index
        }
    }

    return Array.from(pages); // Convert Set to Array
}

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('Uploaded file:', req.file);

        const { pageNumber } = req.body;
        if (!pageNumber) {
            return res.status(400).send('Page numbers are required.');
        }

        const filePath = path.join(__dirname, req.file.path);
        if (!fs.existsSync(filePath)) {
            return res.status(500).send('Uploaded file not found.');
        }

        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const newPdf = await PDFDocument.create();

        const totalPages = pdfDoc.getPageCount();
        console.log('Total pages in PDF:', totalPages);

        // Parse the pageNumber input (e.g., "1,3,5" or "1-3,5")
        const pageRanges = pageNumber.split(',').flatMap(range => {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                if (start > end || start < 1 || end > totalPages) {
                    throw new Error(`Invalid range: ${range}`);
                }
                return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
            }
            const page = Number(range);
            if (page < 1 || page > totalPages) {
                throw new Error(`Invalid page number: ${range}`);
            }
            return page - 1;
        });

        console.log('Extracting pages:', pageRanges);

        // Copy the specified pages into the new PDF
        const extractedPages = await newPdf.copyPages(pdfDoc, pageRanges);
        extractedPages.forEach(page => newPdf.addPage(page));

        // Save the new PDF
        const extractedPdfBytes = await newPdf.save();
        const outputPath = path.join(extractedDir, `${Date.now()}_extracted.pdf`);
        fs.writeFileSync(outputPath, extractedPdfBytes);

        res.download(outputPath, (err) => {
            if (err) {
                console.error('Error downloading the file:', err);
                return res.status(500).send('Error downloading the file.');
            }

            // Clean up temporary files
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('Error processing the file:', error);
        res.status(400).send(error.message || 'Error processing the file.');
    }
});


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
