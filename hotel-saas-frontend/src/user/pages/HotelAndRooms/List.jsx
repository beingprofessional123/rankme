import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import MUIDataTable from 'mui-datatables';
import { Modal, Button } from 'react-bootstrap';

const HotelsAndRoomsList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State for the scrape modal
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [currentHotelForScrape, setCurrentHotelForScrape] = useState(null); // Stores the hotel object being scraped
  const [scrapedResults, setScrapedResults] = useState([]);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [scrapingError, setScrapingError] = useState(null);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please log in.');

      const user = JSON.parse(localStorage.getItem('user'));
      const companyId = user?.company_id;
      if (!companyId) throw new Error('Company ID not found in user data.');

      // Ensure your backend endpoint for listing hotels is correct
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
      // data.hotels now contains the isScrapedConnected flag
      setHotels(data.hotels || []);
      toast.success(data.message || 'Hotels loaded successfully!');
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
    setShowScrapeModal(true);
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
          // source_type is now hardcoded to 'booking.com' in the backend, so we don't send it here.
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save scraped hotel mapping.');
      }

      toast.success('Scraped hotel linked successfully!');
      setShowScrapeModal(false);
      fetchHotels(); // Refresh the list to reflect the new connection status
    } catch (err) {
      console.error('Error saving scraped hotel:', err);
      toast.error(err.message || 'Failed to link scraped hotel.');
    }
  };

  const columns = [
    { name: 'id', label: 'ID', options: { filter: false, sort: true } },
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
        customBodyRender: (value) => (value && value.length > 0 ? value.join(', ') : 'N/A'),
      },
    },
    {
      name: 'Actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        customBodyRenderLite: (dataIndex) => {
          const hotel = hotels[dataIndex];
          return (
            <>
              <a href="#" onClick={() => handleView(hotel.id)}><img src={`/user/images/view.svg`} alt="View" className="mx-1" /></a>
              <a href="#" onClick={() => handleEdit(hotel.id)}><img src={`/user/images/edit.svg`} alt="Edit" className="mx-1" /></a>
              <a href="#" onClick={() => handleDelete(hotel.id)}><img src={`/user/images/deletetd.svg`} alt="Delete" className="mx-1" /></a>
              
              {/* Conditional rendering for the Connect Action */}
              {!hotel.isScrapedConnected && ( // <--- This is the key change!
                <a href="#" onClick={() => handleConnect(hotel)} title="Connect to Scrape Source">
                  <img src="/user/images/link.svg" alt="Connect" className="mx-1" style={{ width: '20px', height: '20px' }} />
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
            <div className="col-md-6 text-end">
              <a href="#" onClick={() => navigate('/hotels-and-rooms/add')} className="btn btn-info">
                <img src={`/user/images/roomadd.svg`} alt="Add" className="img-fluid" /> Add
              </a>
            </div>
          </div>

          <div className="">
            <MUIDataTable
              title="Hotels List"
              data={hotels}
              columns={columns}
              options={options}
            />
          </div>
        </div>
      </div>

      <Modal show={showScrapeModal} onHide={() => setShowScrapeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Scrape Results for {currentHotelForScrape?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scrapingLoading && <p>Loading scraped data...</p>}
          {scrapingError && <p className="text-danger">Error: {scrapingError}</p>}
          
          {!scrapingLoading && scrapedResults.length === 0 && !scrapingError && (
            <p>No matching hotels found from the scrape source.</p>
          )}

          <div className="row">
            {scrapedResults.map((item, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card h-100">
                  <img 
                    src={item.image_url || 'https://via.placeholder.com/150'}
                    className="card-img-top" 
                    alt={item.hotel_name || 'Scraped Hotel Image'}
                    style={{ height: '150px', objectFit: 'cover' }} 
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{item.hotel_name || 'N/A'}</h5>
                    <p className="card-text">City: {item.city_name || 'N/A'}</p>
                    <p className="card-text">Source ID: {item.dest_id || 'N/A'}</p>
                    <div className="mt-auto">
                        <Button 
                            variant="primary" 
                            onClick={() => handleSelectScrapedHotel(item)}
                            className="w-100"
                        >
                            Select
                        </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowScrapeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
};

export default HotelsAndRoomsList;