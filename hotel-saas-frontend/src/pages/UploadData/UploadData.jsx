import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Tabs from './Tabs';
import FileUploadSection from './FileUploadSection';
import DataTable from './DataTable';
import csvTemplates from '../../utils/csvTemplates'; // Still needed for DataTable's template download
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';


// Import SweetAlert2
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Link } from 'react-router-dom';

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
  }, []);

  const getFileTypeForApi = (tabName) => {
    switch (tabName) {
      case 'Booking Data':
        return 'booking';
      case 'Competitor Data':
        return 'competitor';
      case 'STR/OCR Reports':
        return 'str_ocr_report';
      default:
        return 'unknown';
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadId) {
      setError('No data to confirm. Please upload a file first.');
      return;
    }
    if (!dataSourceName || !hotelPropertyId || !dateRangeFrom || !dateRangeTo) {
      setError('Please fill in all data source details (Name, Property, Date Range).');
      return;
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
          dataSourceName,
          hotelPropertyId,
          dateRangeFrom,
          dateRangeTo,
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
      case 'Competitor Data':
        return 'Competitor Data Preview';
      case 'STR/OCR Reports':
        return 'STR/OCR Reports Preview';
      default:
        return 'Data Preview';
    }
  };

  // Removed handleDownloadTemplate from here as it's moving to DataTable

  useEffect(() => {
    handleClearFile();
  }, [activeTab, handleClearFile]);


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
                    <li className="breadcrumb-item"><Link href="#">Home</Link></li>
                    <li className="breadcrumb-item active" aria-current="page">{activeTab}</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
          <div className="white-bg dataupload">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="tab-content">
              <div id="home1" className="tab-pane active">
                <form action="">
                  <div className="form-design">
                    <FileUploadSection
                      onFileExtracted={handleFileExtracted}
                      setLoading={setLoading}
                      setError={setError}
                      fileName={fileName}
                      fileType={getFileTypeForApi(activeTab)}
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

                    {extractedData.length > 0 && (
                      <>
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
                        {/* REMOVED: Download Template button is no longer here */}
                        <DataTable
                          data={extractedData}
                          title={getTableTitle(activeTab)}
                          onConfirm={handleConfirmUpload}
                          onCancel={handleCancel}
                          activeTab={activeTab} // Pass activeTab to DataTable for template download logic
                        />
                      </>
                    )}
                  </div>
                </form>
              </div>
              <div id="home2" className="tab-pane">
                <form action="">
                  <div className="form-design">
                    <FileUploadSection
                      onFileExtracted={handleFileExtracted}
                      setLoading={setLoading}
                      setError={setError}
                      fileName={fileName}
                      fileType={getFileTypeForApi(activeTab)}
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

                    {extractedData.length > 0 && (
                      <>
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
                        {/* REMOVED: Download Template button is no longer here */}
                        <DataTable
                          data={extractedData}
                          title={getTableTitle(activeTab)}
                          onConfirm={handleConfirmUpload}
                          onCancel={handleCancel}
                          activeTab={activeTab} // Pass activeTab to DataTable for template download logic
                        />
                      </>
                    )}
                  </div>
                </form>
              </div>
              <div id="home3" className="tab-pane">
                <form action="">
                  <div className="form-design">
                    <FileUploadSection
                      onFileExtracted={handleFileExtracted}
                      setLoading={setLoading}
                      setError={setError}
                      fileName={fileName}
                      fileType={getFileTypeForApi(activeTab)}
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

                    {extractedData.length > 0 && (
                      <>
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
                        {/* REMOVED: Download Template button is no longer here */}
                        <DataTable
                          data={extractedData}
                          title={getTableTitle(activeTab)}
                          onConfirm={handleConfirmUpload}
                          onCancel={handleCancel}
                          activeTab={activeTab} // Pass activeTab to DataTable for template download logic
                        />
                      </>
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