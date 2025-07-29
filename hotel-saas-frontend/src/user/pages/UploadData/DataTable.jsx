import React, { useMemo } from 'react';
import MUIDataTable from 'mui-datatables';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import csvTemplates from '../../utils/csvTemplates';

const DataTable = ({ data, title = 'Data Preview', onConfirm, onCancel, activeTab }) => {

    // Helper map for activeTab to API fileType
    const activeTabToFileType = {
        'Booking Data': 'booking',
        'STR/OCR Reports': 'str_ocr_report',
        'Property Price': 'property_price_data'
    };

    // Define the specific display headers for each activeTab
    const getDisplayHeadersForTab = (tab) => {
        const apiFileType = activeTabToFileType[tab] || null;

        if (apiFileType && csvTemplates[apiFileType]) {
            // For Property Price, we want specific backend keys to be displayed
            if (tab === 'Property Price') {
                // These are the *backend field names* that should be displayed
                return ['checkIn', 'competitorHotel', 'rate', 'compAvg'];
            }

            // For other tabs, use the template headers, and convert them to camelCase
            return csvTemplates[apiFileType].map(header => {
                // Specific mapping for STR/OCR if needed, otherwise general camelCase
                if (header === 'ADR (USD)') return 'adrUsd';
                if (header === 'RevPAR (USD)') return 'revParUsd';
                if (header === 'Room Type') return 'roomType'; // Example, ensure consistency

                // Convert original header (e.g., "Check In Date") to camelCase (e.g., "checkInDate")
                return header.replace(/([ (])-([a-zA-Z])/g, (match, p1, p2) => p2.toUpperCase())
                             .replace(/[^a-zA-Z0-9]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '')
                             .replace(/^./, (str) => str.toLowerCase());
            });
        }
        // Fallback: If no specific template, or tab not found, try to derive from data
        return data.length > 0 ? Object.keys(data[0]).filter(key =>
            !['id', 'metaUploadDataId', 'uploadDataId', 'userId', 'createdAt', 'updatedAt', 'isValid', 'validationErrors'].includes(key)
        ) : [];
    };

    const displayHeaders = useMemo(() => getDisplayHeadersForTab(activeTab), [activeTab, data]);

    const formatHeader = (header) => {
        // These are labels shown to the user, based on the `name` (data key)
        if (header === 'adrUsd') return 'ADR (USD)';
        if (header === 'revParUsd') return 'RevPAR (USD)';
        if (header === 'roomType') return 'Room Type';
        if (header === 'rate' && activeTab === 'Property Price') return 'Price'; // Specific for Property Price
        if (header === 'platform') return 'Platform';
        if (header === 'checkIn') return 'Check In Date'; // Explicitly map 'checkIn' to 'Check In Date'
        if (header === 'competitorHotel') return 'Competitor Hotel';
        if (header === 'compAvg') return 'Comp Avg';

        // General camelCase to Title Case formatting for other headers
        return header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    const columns = useMemo(() => displayHeaders.map(header => ({
        name: header, // This is the key in your data object (e.g., 'rate', 'checkIn', 'competitorHotel')
        label: formatHeader(header), // This is what the user sees (e.g., 'Price', 'Check In Date', 'Competitor Hotel')
        options: {
            customBodyRenderLite: (dataIndex) => {
                const row = data[dataIndex];
                let cellData = row[header]; // This will now correctly access row.rate for the 'rate' column, etc.

                // --- NEW CODE START ---
                // Add dollar symbol for 'rate' and 'compAvg' fields in 'Property Price' tab
                if (activeTab === 'Property Price') {
                    if (header === 'rate' || header === 'compAvg') {
                        // Ensure cellData is a number before formatting
                        const numericValue = parseFloat(cellData);
                        if (!isNaN(numericValue)) {
                            cellData = `$${numericValue.toFixed(2)}`; // Format to 2 decimal places and add dollar sign
                        } else {
                            cellData = 'N/A'; // Or whatever you want for non-numeric values
                        }
                    }
                }
                // --- NEW CODE END ---

                const hasError = row.validationErrors &&
                    row.validationErrors.some(err => {
                        const formattedLabel = formatHeader(header);
                        return err.field.toLowerCase() === header.toLowerCase() ||
                               err.field.toLowerCase() === formattedLabel.toLowerCase() ||
                               (activeTab === 'Property Price' && header === 'rate' && err.field.toLowerCase().includes('comp #'));
                    });

                const errorMessage = hasError
                    ? row.validationErrors
                        .filter(err => {
                            const formattedLabel = formatHeader(header);
                            return err.field.toLowerCase() === header.toLowerCase() ||
                                   err.field.toLowerCase() === formattedLabel.toLowerCase() ||
                                   (activeTab === 'Property Price' && header === 'rate' && err.field.toLowerCase().includes('comp #'));
                        })
                        .map(err => err.message)
                        .join(', ')
                    : '';

                return hasError ? (
                    <span title={errorMessage}>
                        <img src={`/user/images/warning.svg`} alt="Warning" style={{ width: 16, height: 16, marginRight: 4 }} />
                        {cellData ?? 'N/A'}
                    </span>
                ) : (
                    cellData ?? 'N/A'
                );
            }
        }
    })), [data, displayHeaders, activeTab]);

    const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        responsive: 'standard',
        pagination: true,
        rowsPerPage: 10,
        setRowProps: (row, dataIndex) => {
            const isInvalid = data[dataIndex].isValid === false;
            return {
                className: isInvalid ? 'warningtr' : ''
            };
        }
    };

    const handleDownloadTemplate = () => {
        const apiFileType = activeTabToFileType[activeTab] || 'unknown';

        const headers = csvTemplates[apiFileType];
        if (!headers || headers.length === 0) {
            toast.error('No template defined for this data type.');
            return;
        }

        const csvString = headers.map(h => `"${h}"`).join(',') + '\n';
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${apiFileType}_template.csv`);
        toast.success(`'${apiFileType}_template.csv' downloaded successfully!`);
    };

    if (!data || data.length === 0) {
        return (
            <div className="white-bg dataupload">
                <div className="data-uploadtable">
                    <div className="data-uploadtop">
                        <h2>{title}</h2>
                        <span>
                            <img src={`/user/images/download.svg`} className="img-fluid mr-2" alt="Download Template"
                                onClick={handleDownloadTemplate} style={{ cursor: 'pointer' }} />
                        </span>
                    </div>
                    <div className="tabledesign">
                        <div className="alert alert-info text-center py-4" role="alert">
                            No data available for preview. Please upload a file for {activeTab}.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="data-uploadtable">
            <div className="data-uploadtop d-flex justify-content-between align-items-center">
                <h2>{title}</h2>
                    <span>
                        <img src={`/user/images/download.svg`} className="img-fluid mr-2" alt="Download Template"
                            onClick={handleDownloadTemplate} style={{ cursor: 'pointer' }} />
                    </span>
            </div>

            <div className="tabledesign">
                <div className="table-responsive">
                    <MUIDataTable
                        title={title}
                        data={data}
                        columns={columns}
                        options={options}
                    />
                </div>
            </div>

            <div className="data-upload-btn d-flex justify-content-end mt-4">
                <button type="button" className="btn btn-info cancelbtn mr-2" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" className="btn btn-info" onClick={onConfirm}>
                    Confirm & Upload
                </button>
            </div>
        </div>
    );
};

export default DataTable;