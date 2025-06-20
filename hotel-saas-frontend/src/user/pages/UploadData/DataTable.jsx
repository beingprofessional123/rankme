import React, { useMemo } from 'react';
import MUIDataTable from 'mui-datatables';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';
import csvTemplates from '../../utils/csvTemplates';


const DataTable = ({ data, title = 'Data Preview', onConfirm, onCancel, activeTab }) => {
    const allHeaders = data.length > 0 ? Object.keys(data[0]) : [];

    const displayHeaders = allHeaders.filter(key =>
        !['id', 'metaUploadDataId', 'uploadDataId', 'userId', 'createdAt', 'updatedAt', 'isValid', 'validationErrors'].includes(key)
    );

    const formatHeader = (header) => {
        if (header === 'adrUsd') return 'ADR (USD)';
        if (header === 'revParUsd') return 'RevPAR (USD)';
        return header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    const columns = useMemo(() => displayHeaders.map(header => ({
        name: header,
        label: formatHeader(header),
        options: {
            customBodyRenderLite: (dataIndex) => {
                const row = data[dataIndex];
                const cellData = row[header];

                const hasError = row.validationErrors &&
                    row.validationErrors.some(err => err.field.toLowerCase() === header.toLowerCase());

                const errorMessage = hasError
                    ? row.validationErrors
                        .filter(err => err.field.toLowerCase() === header.toLowerCase())
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
    })), [data]);

    const options = {
        selectableRows: 'none',
        search: true,
        download: false, // we manage template download separately
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
        const apiFileType = {
            'Booking Data': 'booking',
            'Competitor Data': 'competitor',
            'STR/OCR Reports': 'str_ocr_report'
        }[activeTab] || 'unknown';

        const headers = csvTemplates[apiFileType];
        if (!headers || headers.length === 0) return toast.error('No template defined.');

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
                            No data available for preview. Please upload a file.
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
                <MUIDataTable
                    title=""
                    data={data}
                    columns={columns}
                    options={options}
                />
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
