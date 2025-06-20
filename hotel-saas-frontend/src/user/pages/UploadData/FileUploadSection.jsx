import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileImport, faTrash, faTimesCircle } from '@fortawesome/free-solid-svg-icons'; // Added more icons for file block

const FileUploadSection = ({ onFileExtracted, setLoading, setError, fileName, fileType }) => {
    const [highlight, setHighlight] = useState(false);
    const fileInputRef = useRef(null);
    const [showCannotUploadMessage, setShowCannotUploadMessage] = useState(false); // State to control error message visibility

    // Define allowed MIME types for each fileType
    const allowedMimeTypes = {
        booking: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], // CSV, XLS, XLSX
        competitor: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], // CSV, XLS, XLSX
        str_ocr_report: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    };

    const handleUpload = async (file) => {
        if (!file) {
            setShowCannotUploadMessage(true); // Show "Please select a file first"
            return;
        }

        const currentAllowedTypes = allowedMimeTypes[fileType] || [];
        const isValidMimeType = currentAllowedTypes.includes(file.type); // Renamed for clarity

        // Also check file extension as a fallback, especially for CSVs that might have generic MIME types
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isExtensionValid = (
            (fileType === 'booking' || fileType === 'competitor') && ['csv', 'xls', 'xlsx'].includes(fileExtension)
        ) || (
            fileType === 'str_ocr_report' && ['csv', 'xls', 'xlsx'].includes(fileExtension) 
        );

        // Check for both MIME type and extension validity
        if (!isValidMimeType && !isExtensionValid) {
            const msg = `Invalid file type for ${fileType.replace('_', ' ')}. Please upload a supported file type (e.g., ${getAcceptedFileTypes(fileType)}).`;
            setError(msg); // Set specific error for invalid type
            return;
        }

        setLoading(true);
        setError(null); // Clear previous API/validation errors
        setShowCannotUploadMessage(false); // Hide "Please select a file first" if a file is selected

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType); // Pass the specific fileType to the backend

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/upload/extract-preview`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type': 'multipart/form-form-data' is automatically set by browsers when using FormData
                },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'File upload failed.');
            }

            const result = await response.json();
            onFileExtracted(result.previewData, file, result.uploadId);
        } catch (err) {
            onFileExtracted([], null, null); // Clear data on error
            console.error('Error uploading file:', err);
            const msg = err.message || 'An error occurred during file upload.';
            setError(msg); // Set API error
            return;
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(false);
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleUpload(files[0]);
        } else {
            // This else block is less likely to be hit if file input is triggered by label,
            // but kept for robustness if direct input interaction happens.
            setShowCannotUploadMessage(true);
        }
    };

    // REMOVE THIS FUNCTION: It's causing the double click
    // const handleClickBrowse = () => {
    //     fileInputRef.current.click();
    // };

    const handleCancelAlert = () => {
        setShowCannotUploadMessage(false);
    };

    const handleRemoveFile = () => {
        onFileExtracted([], null, null); // Clear data and filename
        if (fileInputRef.current) { // Added null check for ref
            fileInputRef.current.value = ''; // Clear the selected file in the input
        }
        setShowCannotUploadMessage(false); // Hide any pending messages
    };

    // Determine the accepted file types for the input element
    const getAcceptedFileTypes = (type) => {
        switch (type) {
            case 'booking':
            case 'competitor':
                return '.csv, .xls, .xlsx';
            case 'str_ocr_report':
                return '.csv, .xls, .xlsx';
            default:
                return '*/*'; // Allow all by default if type is unknown
        }
    };

    return (
        <div className="form-group">
            <label className="form-label">File Attachment</label>
            <div className="upload-files-container">
                <div
                    className={`drag-file-area ${highlight ? 'dragged-over' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <span className="material-icons-outlined upload-icon">
                        <img src={`/user/images/uploadicon.svg`} className="img-fluid" alt="Upload Icon" />
                    </span>
                    {/* Updated message to be more accurate based on fileType */}
                    <h3 className="dynamic-message">Drag and drop your {fileType === 'str_ocr_report' ? 'CSV/Excel' : 'CSV/Excel'} file here, or</h3>
                    <label className="label">
                        {/* The input is inside the label. Clicking the span inside the label
                            will now naturally trigger the input without programmatic click. */}
                        <input
                            type="file"
                            className="default-file-input"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept={getAcceptedFileTypes(fileType)}
                            // No onClick on the span needed here, as the label handles it.
                        />
                        {/* Changed the span to be a clickable part within the label. */}
                        <span className="browse-files browse-files-text">Click to browse</span>
                    </label>

                    {showCannotUploadMessage && (
                        <span className="cannot-upload-message">
                            <span className="material-icons-outlined">error</span> Please select a file first
                            <span className="material-icons-outlined cancel-alert-button" onClick={handleCancelAlert}>
                                <FontAwesomeIcon icon={faTimesCircle} /> {/* Using FontAwesome for cancel icon */}
                            </span>
                        </span>
                    )}

                    {fileName && (
                        <div className="file-block">
                            <div className="file-info">
                                <span className="material-icons-outlined file-icon">
                                    <FontAwesomeIcon icon={faFileImport} /> {/* Using FontAwesome for file import icon */}
                                </span>
                                <span className="file-name">{fileName}</span> | <span className="file-size"> {/* Placeholder for file size if you want to add it */} </span>
                            </div>
                            <span className="material-icons remove-file-icon" onClick={handleRemoveFile}>
                                <FontAwesomeIcon icon={faTrash} /> {/* Using FontAwesome for trash icon */}
                            </span>
                            <div className="progress-bar"> </div> {/* Placeholder for progress bar */}
                        </div>
                    )}

                    {/* This upload button is hidden in your HTML, keeping it as is */}
                    <button type="button" className="upload-button" style={{ width: '0px', opacity: '0', height: '0px', padding: '0px', margin: '0px' }}> Upload </button>
                </div>
            </div>
        </div>
    );
};

export default FileUploadSection;