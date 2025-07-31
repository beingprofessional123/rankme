import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Tabs from './Tabs';
import FileUploadSection from './FileUploadSection';
import DataTable from './DataTable';
import csvTemplates from '../../utils/csvTemplates';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Link } from 'react-router-dom';
import { saveAs } from 'file-saver';


const MySwal = withReactContent(Swal);

const UploadData = () => {
    const [activeTab, setActiveTab] = useState('Booking Data');
    const [extractedData, setExtractedData] = useState([]);
    const [uploadId, setUploadId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const [dataSourceName, setDataSourceName] = useState('');
    const [hotelPropertyId, setHotelPropertyId] = useState('');
    const [dateRangeFrom, setDateRangeFrom] = useState('');
    const [dateRangeTo, setDateRangeTo] = useState('');
    const [hotelProperties, setHotelProperties] = useState([]);
    // NEW state to store the selected hotel property name
    const [selectedHotelPropertyName, setSelectedHotelPropertyName] = useState('');

    useEffect(() => {
        const fetchHotelProperties = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No auth token found.');

                const user = JSON.parse(localStorage.getItem('user'));
                const company = user.company_id;

                if (!company) throw new Error('Company info missing.');

                const url = new URL(`${process.env.REACT_APP_API_BASE_URL}/api/hotels/list`);
                url.searchParams.append('company_id', company);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch hotel properties');
                }

                const data = await response.json();
                setHotelProperties(data.hotels || data);
            } catch (err) {
                console.error('Failed to load hotel properties:', err);
                setError(err.message || 'Could not load hotel properties.');
            }
        };

        fetchHotelProperties();
    }, []);

    // NEW useEffect to update selectedHotelPropertyName when hotelPropertyId changes
    useEffect(() => {
        if (hotelPropertyId) {
            const selectedProperty = hotelProperties.find(prop => String(prop.id) === String(hotelPropertyId));
            setSelectedHotelPropertyName(selectedProperty ? selectedProperty.name : '');
        } else {
            setSelectedHotelPropertyName('');
        }
    }, [hotelPropertyId, hotelProperties]);


    const handleFileExtracted = useCallback((data, fileInfo, uploadIdFromApi) => {
        setExtractedData(data);
        setUploadId(uploadIdFromApi);
        setFileName(fileInfo ? fileInfo.name : '');
        setError(null);
    }, []);

    const handleClearFile = useCallback(() => {
        setFileName('');
        setExtractedData([]);
        setUploadId(null);
        setError(null);
        setDataSourceName('');
        setHotelPropertyId('');
        setDateRangeFrom('');
        setDateRangeTo('');
        setSelectedHotelPropertyName(''); // Also clear the name
    }, []);

    const getFileTypeForApi = (tabName) => {
        switch (tabName) {
            case 'Booking Data':
                return 'booking';
            case 'STR/OCR Reports':
                return 'str_ocr_report';
            case 'Property Price':
                return 'property_price_data';
            default:
                return 'unknown';
        }
    };

    const handleConfirmUpload = async () => {
        if (!uploadId) {
            setError('No data to confirm. Please upload a file first.');
            return;
        }

        if (activeTab === 'Property Price' || activeTab === 'Booking Data') {
            if (!dataSourceName || !hotelPropertyId || !dateRangeFrom || !dateRangeTo) {
                const typeLabel = activeTab === 'Property Price' ? 'Property Price' : 'Booking Data';
                setError(`Please fill in all data source details (Name, Property, Date Range) for ${typeLabel}.`);
                return;
            }
        }


        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found. Please log in.');
            }

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/upload/confirm-save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    uploadId,
                    dataSourceName: activeTab === 'Property Price' || activeTab === 'Booking Data' ? dataSourceName : undefined,
                    hotelPropertyId: activeTab === 'Property Price' || activeTab === 'Booking Data' ? hotelPropertyId : undefined,
                    dateRangeFrom: activeTab === 'Property Price' || activeTab === 'Booking Data' ? dateRangeFrom : undefined,
                    dateRangeTo: activeTab === 'Property Price' || activeTab === 'Booking Data' ? dateRangeTo : undefined,
                    // No need to send hotelProperty Name to confirm-save, as ID is sufficient for backend
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to confirm and save data.');
            }

            const result = await response.json();
            toast.success(result.message);
            handleClearFile();
        } catch (err) {
            console.error('Error confirming upload:', err);
            setError(err.message || 'An error occurred during confirmation.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        const result = await MySwal.fire({
            title: 'Confirm Cancellation',
            text: 'Are you sure you want to cancel the upload process? All unsaved changes will be lost.',
            icon: 'warning',
            confirmButtonText: 'Yes, cancel!',
            cancelButtonText: 'No, keep editing',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            handleClearFile();
            toast.info('Upload process cancelled.');
        } else {
            toast.info('Cancellation aborted.');
        }
    };

    const getTableTitle = (tabName) => {
        switch (tabName) {
            case 'Booking Data':
                return 'Booking Data Preview';
            case 'STR/OCR Reports':
                return 'STR/OCR Reports Preview';
            case 'Property Price':
                return 'Property Price Data Preview';
            default:
                return 'Data Preview';
        }
    };

    const handleDownloadTemplate = () => {
        const apiFileType = {
            'Booking Data': 'booking',
            'STR/OCR Reports': 'str_ocr_report',
            'Property Price': 'property_price_data'
        }[activeTab] || 'unknown';

        const headers = csvTemplates[apiFileType];
        if (!headers || headers.length === 0) return toast.error('No template defined for this data type.');

        const csvString = headers.map(h => `"${h}"`).join(',') + '\n';
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${apiFileType}_template.csv`);
        toast.success(`'${apiFileType}_template.csv' downloaded successfully!`);
    };

    useEffect(() => {
        // Clear all relevant states when tab changes
        setFileName('');
        setExtractedData([]);
        setUploadId(null);
        setError(null);
        setDataSourceName('');
        setHotelPropertyId('');
        setDateRangeFrom('');
        setDateRangeTo('');
        setSelectedHotelPropertyName(''); // Ensure this is also cleared
    }, [activeTab]);


    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Upload Data</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to="#">Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">{activeTab}</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg dataupload">
                        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

                        <div className="tab-content">
                            <div id="uploadContent" className="tab-pane active">
                                <form>
                                    <div className="form-design">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h4>Upload Your Data</h4>
                                            <img src={`/user/images/download.svg`} alt="Download Template" onClick={handleDownloadTemplate} style={{ cursor: 'pointer' }} />
                                        </div>

                                        {/* Conditional rendering for meta fields */}
                                        {(activeTab === 'Property Price' || activeTab === 'Booking Data') && (
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="dataSourceName" className="form-label">Data Source Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            id="dataSourceName"
                                                            placeholder="Data Source Name"
                                                            value={dataSourceName}
                                                            onChange={(e) => setDataSourceName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="hotelProperty" className="form-label">Hotel Property</label>
                                                        <select
                                                            className="form-select form-control"
                                                            id="hotelProperty"
                                                            value={hotelPropertyId}
                                                            onChange={(e) => setHotelPropertyId(e.target.value)}
                                                        >
                                                            <option value="">Select Hotel Property</option>
                                                            {hotelProperties.map((prop) => (
                                                                <option key={prop.id} value={prop.id}>{prop.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="dateRangeFrom" className="form-label">Date Range</label>
                                                        <div className="daterange">
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                id="dateRangeFrom"
                                                                value={dateRangeFrom}
                                                                onChange={(e) => setDateRangeFrom(e.target.value)}
                                                            />
                                                            <span>-</span>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                id="dateRangeTo"
                                                                value={dateRangeTo}
                                                                onChange={(e) => setDateRangeTo(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* FileUploadSection comes after the above fields (conditionally rendered or not) */}
                                        <FileUploadSection
                                            onFileExtracted={handleFileExtracted}
                                            setLoading={setLoading}
                                            setError={setError}
                                            fileName={fileName}
                                            fileType={getFileTypeForApi(activeTab)} // Pass the active tab's file type
                                            hotelPropertyId={hotelPropertyId}      // Pass the selected hotel property ID
                                            selectedHotelPropertyName={selectedHotelPropertyName} // NEW: Pass the hotel property name
                                        />
                                        {error && (
                                            <div className="alert alert-danger alert-dismissible fade show d-flex justify-content-between align-items-center" role="alert">
                                                <div>
                                                    <strong>Error!</strong> {error}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-white p-0"
                                                    onClick={() => setError(null)}
                                                    style={{ fontSize: '1.2rem' }}
                                                    aria-label="Close"
                                                >
                                                    <FontAwesomeIcon icon={faTimesCircle} />
                                                </button>
                                            </div>
                                        )}

                                        {loading && <div className="text-center text-primary mb-4">Processing file...</div>}

                                        {/* DataTable only shows if extractedData is available */}
                                        {extractedData.length > 0 && (
                                            <DataTable
                                                data={extractedData}
                                                title={getTableTitle(activeTab)}
                                                onConfirm={handleConfirmUpload}
                                                onCancel={handleCancel}
                                                activeTab={activeTab}
                                            />
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UploadData;