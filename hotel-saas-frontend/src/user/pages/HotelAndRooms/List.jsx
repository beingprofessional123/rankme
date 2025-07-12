import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import MUIDataTable from 'mui-datatables';
// Removed: import { Modal, Button } from 'react-bootstrap';
import { PermissionContext } from '../../UserPermission';

const HotelsAndRoomsList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { permissions, role } = useContext(PermissionContext);
  const isCompanyAdmin = role?.name === 'company_admin';
  const canAccess = (action) => {
    if (isCompanyAdmin) return true;
    return permissions?.hotels_rooms?.[action] === true;
  };

  // State for the scrape modal
  const [showScrapeModal, setShowScrapeModal] = useState(false); // Still needed to trigger manual show/hide
  const [currentHotelForScrape, setCurrentHotelForScrape] = useState(null); // Stores the hotel object being scraped
  const [scrapedResults, setScrapedResults] = useState([]);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [scrapingError, setScrapingError] = useState(null);

  // Ref for the Bootstrap modal instance
  const scrapeModalRef = useRef(null);

  // Effect to manage Bootstrap modal visibility manually
  useEffect(() => {
    // Dynamically import Bootstrap's JavaScript for modal functionality
    // This is safer to ensure Bootstrap's JS is loaded when needed
    const loadBootstrapModal = async () => {
      if (typeof window !== 'undefined') {
        const bootstrap = await import('bootstrap');
        if (scrapeModalRef.current) {
          const modalInstance = bootstrap.Modal.getInstance(scrapeModalRef.current) || new bootstrap.Modal(scrapeModalRef.current);
          if (showScrapeModal) {
            modalInstance.show();
          } else {
            modalInstance.hide();
          }
        }
      }
    };
    loadBootstrapModal();
  }, [showScrapeModal]); // Re-run when showScrapeModal changes

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!companyId) throw new Error('Company ID not found in user data.');

      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${companyId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hotels.');
      }

      const data = await response.json();
      setHotels(data.hotels || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to load hotels.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleView = (hotelId) => navigate(`/hotels-and-rooms/${hotelId}`);
  const handleEdit = (hotelId) => navigate(`/hotels-and-rooms/edit/${hotelId}`);

  const handleDelete = async (hotelId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/delete/${hotelId}`;

          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete hotel.');
          }

          const data = await response.json();
          toast.success(data.message || 'Hotel deleted successfully!');
          fetchHotels();
        } catch (err) {
          console.error('Error:', err);
          toast.error(err.message || 'Failed to delete hotel.');
        }
      }
    });
  };

  const handleConnect = async (hotel) => {
    setCurrentHotelForScrape(hotel);
    setShowScrapeModal(true); // This will trigger the useEffect to show the Bootstrap modal
    setScrapingLoading(true);
    setScrapedResults([]);
    setScrapingError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const searchQuery = `${hotel.name}, ${hotel.location}`;
      const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/scraped-hotel-detail/${hotel.id}?query=${encodeURIComponent(searchQuery)}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape hotel details.');
      }

      const data = await response.json();
      setScrapedResults(data.scraped_details || []);
      if (data.scraped_details && data.scraped_details.length > 0) {
        toast.success('Scraped data loaded successfully!');
      } else {
        toast.info('No scraped results found for this hotel.');
      }
    } catch (err) {
      console.error('Error scraping hotel:', err);
      setScrapingError(err.message);
      toast.error(err.message || 'Failed to scrape hotel details.');
    } finally {
      setScrapingLoading(false);
    }
  };

  const handleSelectScrapedHotel = async (scrapedHotelData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const saveApiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/scrape-source-hotels/save`;
      const response = await fetch(saveApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotel_id: currentHotelForScrape.id,
          source_hotel_id: scrapedHotelData.dest_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save scraped hotel mapping.');
      }

      toast.success('Scraped hotel linked successfully!');
      setShowScrapeModal(false); // This will trigger the useEffect to hide the Bootstrap modal
      fetchHotels(); // Refresh the list to reflect the new connection status
    } catch (err) {
      console.error('Error saving scraped hotel:', err);
      toast.error(err.message || 'Failed to link scraped hotel.');
    }
  };

  const columns = [
    {
      name: 'S.No.',
      label: 'S.No.',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex) => dataIndex + 1, // Serial number starts from 1
      },
    },
    { name: 'name', label: 'Hotel', options: { filter: false, sort: true } },
    {
      name: 'location',
      label: 'Location',
      options: { filter: false, sort: true },
    },
    {
      name: 'Rooms',
      label: 'Rooms',
      options: {
        customBodyRender: (value) => {
          if (Array.isArray(value) && value.length > 0) {
            if (typeof value[0] === 'object' && value[0] !== null && 'name' in value[0]) {
              return value.map(room => room.name).join(', ');
            }
            return value.join(', ');
          }
          return 'N/A';
        },
      },
    },
    {
      name: 'Actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        customHeadRender: (columnMeta) => {
          return (
            <th key={columnMeta.index} style={{ minWidth: '170px' }}>
              {columnMeta.label}
            </th>
          );
        },
        customBodyRenderLite: (dataIndex) => {
          const hotel = hotels[dataIndex];
          return (
            <>
              {canAccess('view') && (
                <a href="#" onClick={() => handleView(hotel.id)} className="action-icon" title="View Details">
                  <img src={`/user/images/view.svg`} alt="View" className="mx-1" />
                </a>
              )}
              {canAccess('edit') && (
                <a href="#" onClick={() => handleEdit(hotel.id)} className="action-icon" title="Edit Hotel">
                  <img src={`/user/images/edit.svg`} alt="Edit" className="mx-1" />
                </a>
              )}
              {!hotel.isScrapedConnected && canAccess('connect') && (
                <a href="#" onClick={() => handleConnect(hotel)} className="action-icon" title="Connect to Scrape Source">
                  <img src="/user/images/link.svg" alt="Connect" className="mx-1" style={{ width: '20px', height: '20px' }} />
                </a>
              )}
              {canAccess('delete') && (
                <a href="#" onClick={() => handleDelete(hotel.id)} className="action-icon" title="Delete Hotel">
                  <img src={`/user/images/deletetd.svg`} alt="Delete" className="mx-1" />
                </a>
              )}
            </>
          );
        },
      },
    },
  ];

  const options = {
    selectableRows: 'none',
    search: true,
    download: true,
    print: false,
    viewColumns: true,
    filter: true,
    pagination: true,
    responsive: 'standard',
  };

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-6">
              <div className="breadcrumb-sec">
                <h2>Hotels & Rooms</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="#">Home</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Hotels & Rooms</li>
                  </ol>
                </nav>
              </div>
            </div>
            <div className="col-md-6">
                <div className="breadcrumb-right">
                  {canAccess('add') && (
                    <a href="#" onClick={() => navigate('/hotels-and-rooms/add')} className="btn btn-info">
                      <img src={`/user/images/roomadd.svg`} alt="Add" className="img-fluid" /> Add
                    </a>

                  )}
               </div>
            </div>
          </div>
          <div className="white-bg">
            <div className="tabledesign">
              <div className="table-responsive">
                <div className="">
                  {loading ? (
                    <p>Loading hotels...</p>
                  ) : error ? (
                    <p className="text-danger">Error: {error}</p>
                  ) : (
                    <MUIDataTable
                      title="Hotels List"
                      data={hotels}
                      columns={columns}
                      options={options}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap 5 Modal for Scrape Results */}
      <div
        className="modal fade modaldesign"
        id="scrapeResultsModal"
        tabIndex="-1"
        aria-labelledby="scrapeResultsModalLabel"
        aria-hidden="true"
        ref={scrapeModalRef} // Attach ref to the modal div
      >
        <div className="modal-dialog modal-lg modal-dialog-centered"> {/* Added modal-dialog-centered */}
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="scrapeResultsModalLabel">
                Scrape Results
              </h4>
              {/* Bootstrap 5 close button */}
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setShowScrapeModal(false)} // Update state when closed via button
              >&times;</button>
            </div>
            <div className="modal-body">
              {scrapingLoading && <p>Loading scraped data...</p>}
              {scrapingError && <p className="text-danger">Error: {scrapingError}</p>}

              {!scrapingLoading && scrapedResults.length === 0 && !scrapingError && (
                <p>No matching hotels found from the scrape source.</p>
              )}
              <div className="row">
                {scrapedResults.map((item, index) => (
                  <div key={index} className="col-md-4">
                    <div className="card hotel_result">
                      <img
                        src={item.image_url || 'https://via.placeholder.com/150'}
                        className="card-img-top"
                        alt={item.hotel_name || 'Scraped Hotel Image'}
                        style={{ height: '150px', objectFit: 'cover' }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{item.hotel_name || 'N/A'}</h5>
                        <p className="card-text"><strong>City:</strong> <span>{item.city_name || 'N/A'}</span></p>
                        <p className="card-text"><strong>Source ID:</strong> <span>{item.dest_id || 'N/A'}</span></p>
                        <div className="mt-auto">
                          <button // Changed from React Bootstrap Button to a regular button
                            type="button"
                            className="btn btn-info w-100" // Applied Bootstrap classes directly
                            onClick={() => handleSelectScrapedHotel(item)}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HotelsAndRoomsList;