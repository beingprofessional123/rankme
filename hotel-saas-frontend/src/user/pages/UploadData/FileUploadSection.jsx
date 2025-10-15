import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faFileImport, faTrash, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';

const FileUploadSection = ({ onFileExtracted, setLoading, setError, fileName, fileType, hotelPropertyId, selectedHotelPropertyName }) => {
    const [highlight, setHighlight] = useState(false);
    const fileInputRef = useRef(null);
    const [showCannotUploadMessage, setShowCannotUploadMessage] = useState(false);

    // Define allowed MIME types for each fileType
    const allowedMimeTypes = {
        booking: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], // CSV, XLS, XLSX
        str_ocr_report: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        property_price_data: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    };

    const handleUpload = async (file) => {
        
        // Determine if hotel property selection is required for the *current* tab
        const requiresHotelProperty = fileType === 'property_price_data' || fileType === 'booking';


        // --- Conditional Validation: Only apply if requiresHotelProperty is true ---
        if (requiresHotelProperty && !hotelPropertyId) {
            setError(null); // Clear any previous errors before showing the new one
            setShowCannotUploadMessage(true); // Show the specific "Please select hotel property first" message
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear selected file from input if validation fails
            }
            return; // Stop the upload process
        }
        // --- End Conditional Validation ---

        if (!file) {
            // This case handles when a user clicks browse but then cancels, or a drag/drop is empty.
            // Only show this general "select a file" message if the hotel property check passed (or wasn't required).
            if (!requiresHotelProperty || hotelPropertyId) {
                 setShowCannotUploadMessage(true);
            }
            return;
        }

        const currentAllowedMimeTypes = allowedMimeTypes[fileType] || [];
        const isValidMimeType = currentAllowedMimeTypes.includes(file.type);

        // Also check file extension as a fallback, especially for CSVs that might have generic MIME types
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isExtensionValid = ['csv', 'xls', 'xlsx'].includes(fileExtension);

        // Check for both MIME type and extension validity
        if (!isValidMimeType && !isExtensionValid) {
            const acceptedTypesDisplay = getAcceptedFileTypes(fileType).split(', ').map(ext => ext.replace('.', '').toUpperCase()).join('/');
            const msg = `Invalid file type. Please upload a ${acceptedTypesDisplay} file for ${fileType.replace(/_/g, ' ')}.`;
            setError(msg); // Set specific error for invalid type
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear selected file from input
            }
            return;
        }

        setLoading(true);
        setError(null); // Clear previous API/validation errors
        setShowCannotUploadMessage(false); // Hide any general "select a file first" message if a valid file is now selected

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType); // Pass the specific fileType to the backend
        if (fileType === 'property_price_data' && selectedHotelPropertyName) {
            formData.append('hotel_property_name', selectedHotelPropertyName);
        }
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
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear selected file from input on API error
            }
            return;
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const requiresHotelProperty = fileType === 'property_price_data' || fileType === 'booking';
        // Only allow highlight if not disabled by validation
        if (!requiresHotelProperty || hotelPropertyId) {
            setHighlight(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const requiresHotelProperty = fileType === 'property_price_data' || fileType === 'booking';
        // Only allow highlight if not disabled by validation
        if (!requiresHotelProperty || hotelPropertyId) {
            setHighlight(true);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setHighlight(false);
        const requiresHotelProperty = fileType === 'property_price_data' || fileType === 'booking';
        // Prevent drop action if hotel property validation fails for the specific tab
        if (requiresHotelProperty && !hotelPropertyId) {
            setShowCannotUploadMessage(true);
            return;
        }
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const requiresHotelProperty = fileType === 'property_price_data' || fileType === 'booking';
        // Prevent file selection if hotel property validation fails for the specific tab
        if (requiresHotelProperty && !hotelPropertyId) {
            setShowCannotUploadMessage(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Clear selected file from input
            }
            return;
        }
        const files = e.target.files;
        if (files && files[0]) {
            handleUpload(files[0]);
        } else {
             // If no file is selected (e.g., user opens dialog and cancels), show appropriate message
             // Only if not blocked by hotel property or if hotel property is selected (for property price tab)
             if (!requiresHotelProperty || hotelPropertyId) {
                setShowCannotUploadMessage(true);
            }
        }
    };

    const handleCancelAlert = () => {
        setShowCannotUploadMessage(false);
        setError(null); // Also clear any general errors when the alert is dismissed
    };

    const handleRemoveFile = () => {
        onFileExtracted([], null, null); // Clear data and filename
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the selected file in the input
        }
        setShowCannotUploadMessage(false); // Hide any pending messages
        setError(null); // Clear any errors
    };

    // Determine the accepted file types for the input element
    const getAcceptedFileTypes = (type) => {
        switch (type) {
            case 'booking':
            case 'str_ocr_report':
            case 'property_price_data':
                return '.csv, .xls, .xlsx';
            default:
                return '*/*'; // Allow all by default if type is unknown
        }
    };

    // This variable controls disabling the upload area and showing tooltips/messages
    // It is true ONLY for 'Property Price' tab AND if no hotelPropertyId is selected
    const shouldDisableUploadArea = (fileType === 'property_price_data' || fileType === 'booking') && !hotelPropertyId;


    return (
        <div className="form-group">
            <label className="form-label">File Attachment</label>
            <div className="upload-files-container">
                <div
                    className={`drag-file-area ${highlight ? 'dragged-over' : ''} ${shouldDisableUploadArea ? 'disabled-upload-area' : ''}`}
                    // Conditional event handlers: null them out if the area should be disabled
                    onDragEnter={shouldDisableUploadArea ? null : handleDragEnter}
                    onDragLeave={shouldDisableUploadArea ? null : handleDragLeave}
                    onDragOver={shouldDisableUploadArea ? null : handleDragOver}
                    onDrop={shouldDisableUploadArea ? null : handleDrop}
                    // Conditional inline style for disabling pointer events and reducing opacity
                    style={shouldDisableUploadArea ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                >
                    <span className="material-icons-outlined upload-icon">
                        <img src={`/user/images/uploadicon.svg`} className="img-fluid" alt="Upload Icon" />
                    </span>
                    <h3 className="dynamic-message">Drag and drop your CSV/Excel file here, or</h3>
                    <label className="label"
                        // Conditional tooltip message for the disabled state
                        title={shouldDisableUploadArea ? "Please select a Hotel Property first." : ""}
                    >
                        <input
                            type="file"
                            className="default-file-input"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept={getAcceptedFileTypes(fileType)}
                            disabled={shouldDisableUploadArea} // Disable the input if validation applies and is not met
                        />
                        <span className="browse-files browse-files-text">Click to browse</span>
                    </label>

                    {/* Conditional message display */}
                    {showCannotUploadMessage && shouldDisableUploadArea && (
                        <span className="cannot-upload-message d-flex align-items-center" style={{ color: '#dc3545', marginTop: '10px' }}>
                            <FontAwesomeIcon icon={faTimesCircle} className="me-2" /> Please select a **Hotel Property** first.
                            <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0 ms-2"
                                onClick={handleCancelAlert}
                                style={{ fontSize: '1.2rem' }}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                        </span>
                    )}

                    {/* This message shows if the user tries to upload *no file*, and the hotel property is already selected (or not required) */}
                    {showCannotUploadMessage && !shouldDisableUploadArea && !fileName && (
                         <span className="cannot-upload-message d-flex align-items-center" style={{ color: '#dc3545', marginTop: '10px' }}>
                            <FontAwesomeIcon icon={faTimesCircle} className="me-2" /> Please select a file first.
                            <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0 ms-2"
                                onClick={handleCancelAlert}
                                style={{ fontSize: '1.2rem' }}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon={faTimesCircle} />
                            </button>
                        </span>
                    )}

                    {fileName && (
                        <div className="file-block">
                            <div className="file-info">
                                <span className="material-icons-outlined file-icon">
                                    <FontAwesomeIcon icon={faFileImport} />
                                </span>
                                <span className="file-name">{fileName}</span> | <span className="file-size"> {/* Placeholder for file size if you want to add it */} </span>
                            </div>
                            <span className="material-icons remove-file-icon" onClick={handleRemoveFile}>
                                <FontAwesomeIcon icon={faTrash} />
                            </span>
                            <div className="progress-bar"> </div>
                        </div>
                    )}

                    {/* Hidden upload button, primarily for styling purposes */}
                    <button type="button" className="upload-button" style={{ width: '0px', opacity: '0', height: '0px', padding: '0px', margin: '0px' }}> Upload </button>
                </div>
            </div>
        </div>
    );
};

export default FileUploadSection;