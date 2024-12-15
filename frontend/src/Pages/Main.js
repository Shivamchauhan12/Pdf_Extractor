import React, { useRef, useState } from 'react';
import axios from 'axios';
 
const Main = () => {
    const [file, setFile] = useState(null);
    const [pageNumber, setPageNumber] = useState('');
    const [downloadLink, setDownloadLink] = useState('');
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false); // State to handle the preview visibility
    const fileRef = useRef();

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);

        // Reset preview visibility when a new file is uploaded
        setShowPreview(false);
    };

    const handlePageChange = (event) => {
        setPageNumber(event.target.value);
    };

    const handlePreviewClick = () => {
      const previewUrl = URL.createObjectURL(file);
      window.open(previewUrl, '_blank'); // This opens the PDF in a new browser window/tab
  };
  

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!file || !pageNumber) {
            setError('Please upload a file and specify page numbers.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('pageNumber', pageNumber);

        try {
            setError('');
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });

            const fileBlob = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(fileBlob);

            // Trigger the download programmatically
            const link = document.createElement('a');
            link.href = fileURL;
            link.download = 'extracted-pages.pdf';
            link.click();

            // Clear the form fields after download starts
            fileRef.current.value = '';
            setPageNumber('');
            setFile("")
            setShowPreview(false); // Clear the preview after download

        } catch (error) {
            console.error('Error extracting pages:', error);
            setError('Failed to extract pages. Please check your input and try again.');
        }
    };

    return (
        <div className="app-container">
            <h1>PDF Page Extractor</h1>
            <form onSubmit={handleSubmit} className="form-container">

              <div className='flex flex-row'>

                    <div className="input-group">
                          <label>
                              Upload PDF:
                              <input
                                  ref={fileRef}
                                  type="file"
                                  accept="application/pdf" 
                                  onChange={handleFileChange}
                              />
                          </label>
                      </div>

                      {file && (
                          <div className="preview-button-container">
                              <button
                                  type="button"
                                  className="preview-button"
                                  onClick={handlePreviewClick}
                              >
                                  Preview PDF
                              </button>
                          </div>
                      )}

              </div>
 

                <div className="input-group">
                    
                        <input
                            type="text"
                            value={pageNumber}
                            onChange={handlePageChange}
                            placeholder="Enter pages (e.g., 1,3 or 1-3,5)"
                        />
                    
                </div>

                <button type="submit" className="submit-button">Extract Pages</button>
            </form>

            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default Main;
