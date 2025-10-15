import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import MUIDataTable from 'mui-datatables';
import { PermissionContext } from '../../UserPermission';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

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
    const [showScrapeModal, setShowScrapeModal] = useState(false);
    const [currentHotelForScrape, setCurrentHotelForScrape] = useState(null);
    const [scrapedResults, setScrapedResults] = useState([]);
    const [scrapingLoading, setScrapingLoading] = useState(false);
    const [scrapingError, setScrapingError] = useState(null);
    const [scrapeSource, setScrapeSource] = useState(null); // 'booking.com' or 'expedia'

    // State for Expedia URL input and results
    const [expediaUrl, setExpediaUrl] = useState('');
    const [expediaUrlError, setExpediaUrlError] = useState('');
    const [expediaScrapedData, setExpediaScrapedData] = useState(null); // To store single hotel data from Expedia URL scrape
    const [showExpediaResults, setShowExpediaResults] = useState(false); // To toggle visibility of Expedia results

    // Refs for Bootstrap modal and collapse instances
    const scrapeModalRef = useRef(null);
    const collapseRef = useRef(null); // Ref for the collapse div for source selection

    // Effect to manage Bootstrap modal visibility manually
    useEffect(() => {
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
    }, [showScrapeModal]);

    // Effect to manage Bootstrap collapse visibility
    useEffect(() => {
        const loadBootstrapCollapse = async () => {
            if (typeof window !== 'undefined' && collapseRef.current) {
                const bootstrap = await import('bootstrap');
                // Ensure that the collapse instance is only created if it doesn't exist
                bootstrap.Collapse.getInstance(collapseRef.current) || new bootstrap.Collapse(collapseRef.current, {
                    toggle: false // Don't toggle automatically on init
                });
            }
        };
        loadBootstrapCollapse();
    }, []); // Run once on component mount

    const fetchHotels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found. Please log in.');

            const user = JSON.parse(localStorage.getItem('user'));
            const companyId = user?.company_id;
            if (!companyId) throw new Error('Company ID not found in user data.');

            // IMPORTANT: Ensure your backend's /api/hotels/list returns hotel objects with
            // an array of associated ScrapeSourceHotels. E.g., hotel.ScrapeSourceHotels
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

    const handleConnectClick = (hotel) => {
        setCurrentHotelForScrape(hotel);
        setScrapeSource(null); // Reset source selection
        setScrapedResults([]);
        setScrapingLoading(false);
        setScrapingError(null);
        setExpediaUrl('');
        setExpediaUrlError('');
        setExpediaScrapedData(null);
        setShowExpediaResults(false);
        setShowScrapeModal(true); // Show the modal

        // Manually show the collapse div for source selection
        if (collapseRef.current) {
            const bootstrap = typeof window !== 'undefined' ? require('bootstrap') : null;
            if (bootstrap) {
                const collapseInstance = bootstrap.Collapse.getInstance(collapseRef.current) || new bootstrap.Collapse(collapseRef.current, {
                    toggle: false
                });
                collapseInstance.show();
            }
        }
    };

    const handleSelectSource = async (source) => {
        setScrapeSource(source);
        setScrapedResults([]);
        setScrapingError(null);
        setExpediaUrl('');
        setExpediaUrlError('');
        setExpediaScrapedData(null);
        setShowExpediaResults(false);

        // Hide the collapse div after a source is selected
        if (collapseRef.current) {
            const bootstrap = typeof window !== 'undefined' ? require('bootstrap') : null;
            if (bootstrap) {
                const collapseInstance = bootstrap.Collapse.getInstance(collapseRef.current);
                if (collapseInstance) {
                    collapseInstance.hide();
                }
            }
        }

        if (source === 'booking.com') {
            await scrapeBookingCom();
        } else if (source === 'expedia') {
            // Do nothing, the modal will show the input field for Expedia URL
        }
    };

    const scrapeBookingCom = async () => {
        setScrapingLoading(true);
        setScrapedResults([]);
        setScrapingError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found. Please log in.');

            const searchQuery = `${currentHotelForScrape.name}, ${currentHotelForScrape.location}`;
            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/scraped-hotel-detail/${currentHotelForScrape.id}?query=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to scrape hotel details from Booking.com.');
            }

            const data = await response.json();
            setScrapedResults(data.scraped_details || []);
            if (data.scraped_details && data.scraped_details.length > 0) {
                toast.success('Scraped data from Booking.com loaded successfully!');
            } else {
                toast.info('No scraped results found for this hotel on Booking.com.');
            }
        } catch (err) {
            console.error('Error scraping hotel from Booking.com:', err);
            setScrapingError(err.message);
            toast.error(err.message || 'Failed to scrape hotel details from Booking.com.');
        } finally {
            setScrapingLoading(false);
        }
    };

    const handleExpediaUrlSubmit = async () => {
        setExpediaUrlError('');
        setExpediaScrapedData(null);
        setShowExpediaResults(false); // Hide previous results

        if (!expediaUrl) {
            setExpediaUrlError('Expedia URL is required.');
            return;
        }
        // A more robust URL validation regex
        if (!/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i.test(expediaUrl)) {
            setExpediaUrlError('Please enter a valid URL.');
            return;
        }

        setScrapingLoading(true);
        setScrapingError(null);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found. Please log in.');
            if (!user?.id) throw new Error('User ID not found. Please log in again.');
            if (!currentHotelForScrape?.id) throw new Error('Hotel ID not found for scraping.');

            const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/hotels/get-scrape-expedia-url-detail`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: expediaUrl,
                    hotel_id: currentHotelForScrape.id, // Pass current hotel ID
                    user_id: user.id, // Pass current user ID (backend will ignore if not needed for extraction)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to scrape hotel details from Expedia URL.');
            }

            const data = await response.json();
            // Assuming data.extractedHotelDetails contains { name, image, url, description }
            if (data.extractedHotelDetails) {
                setExpediaScrapedData({
                    url: data.extractedHotelDetails.url, // Ensure the URL comes from backend's `extractedHotelDetails`
                    name: data.extractedHotelDetails.name,
                    image: data.extractedHotelDetails.image,
                    description: data.extractedHotelDetails.description, // Ensure this is received
                });
                setShowExpediaResults(true);
                toast.success('Expedia hotel details loaded successfully!');
            } else {
                toast.info('No hotel details found for the provided Expedia URL.');
            }
        } catch (err) {
            console.error('Error scraping Expedia URL:', err);
            setScrapingError(err.message);
            toast.error(err.message || 'Failed to scrape Expedia URL.');
        } finally {
            setScrapingLoading(false);
        }
    };


    const handleSelectScrapedHotel = async (scrapedHotelData, source) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication token not found. Please log in.');
            if (!currentHotelForScrape?.id) throw new Error('Hotel ID is missing.');
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user?.id) throw new Error('User ID not found. Please log in again.');


            const saveApiUrl = `${process.env.REACT_APP_API_BASE_URL}/api/scrape-expedia-source-hotels/save`; // Use your specific route for Expedia

            let requestBody;

            if (source === 'booking.com') {
                requestBody = {
                    hotel_id: currentHotelForScrape.id,
                    user_id: user.id,
                    source_type: 'Booking.com', // Corrected to match backend string literal
                    source_hotel_id: scrapedHotelData.dest_id, // Booking.com ID
                    // Booking.com specific data if you were saving them (e.g., name, image)
                    // booking_com_hotel_name: scrapedHotelData.hotel_name,
                    // booking_com_image_url: scrapedHotelData.image_url,
                };
            } else if (source === 'expedia') {
                requestBody = {
                    hotel_id: currentHotelForScrape.id,
                    user_id: user.id,
                    source_type: 'Expedia', // Corrected to match backend string literal
                    source_hotel_id: scrapedHotelData.url, // Expedia often doesn't have a single 'source_hotel_id' like Booking.com's dest_id, so null is fine or leave undefined
                };
            } else {
                throw new Error('Unsupported scrape source.');
            }

            const response = await fetch(saveApiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || `Failed to save scraped hotel mapping for ${source}.`);
            }

            toast.success(`Scraped hotel from ${source} linked successfully!`);
            setShowScrapeModal(false);
            fetchHotels(); // Re-fetch hotels to update the 'Connect' button status
        } catch (err) {
            console.error('Error saving scraped hotel:', err);
            toast.error(err.message || `Failed to link scraped hotel from ${source}.`);
        }
    };

    const baseColumns = [
        {
            name: 'S.No.',
            label: 'S.No.',
            options: {
                filter: false,
                sort: false,
                customBodyRenderLite: (dataIndex) => dataIndex + 1,
            },
        },
        { name: 'name', label: 'Hotel', options: { filter: false, sort: true } },
        {
            name: 'location',
            label: 'Location',
            options: { filter: false, sort: true },
        },
        {
            name: 'total_rooms',
            label: 'Total Rooms',
            options: { filter: false, sort: true },
        },
    ];

    const showActions =
        canAccess('view') || canAccess('edit') || canAccess('connect') || canAccess('delete');

    if (showActions) {
        baseColumns.push({
            name: 'Actions',
            label: 'ACTION',
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
                    const isBookingComConnected = hotel.ScrapeSourceHotels?.some(
                        (s) => s.source_type === 'Booking.com'
                    );
                    const isExpediaConnected = hotel.ScrapeSourceHotels?.some(
                        (s) => s.source_type === 'Expedia'
                    );

                    let connectionStatusText = '';
                    if (isBookingComConnected && isExpediaConnected) {
                        connectionStatusText = 'Connected to Both';
                    } else if (isBookingComConnected) {
                        connectionStatusText = 'Connected (Booking.com)';
                    } else if (isExpediaConnected) {
                        connectionStatusText = 'Connected (Expedia)';
                    }

                    return (
                        <>
                            {canAccess('view') && (
                                <a
                                    href="#"
                                    onClick={() => handleView(hotel.id)}
                                    className="action-icon"
                                    title="View Details"
                                >
                                    <img
                                        src={`/user/images/view.svg`}
                                        alt="View"
                                        className="mx-1"
                                    />
                                </a>
                            )}
                            {canAccess('edit') && (
                                <a
                                    href="#"
                                    onClick={() => handleEdit(hotel.id)}
                                    className="action-icon"
                                    title="Edit Hotel"
                                >
                                    <img
                                        src={`/user/images/edit.svg`}
                                        alt="Edit"
                                        className="mx-1"
                                    />
                                </a>
                            )}
                            {canAccess('connect') &&
                                (!isBookingComConnected || !isExpediaConnected ? (
                                    <a
                                        href="#"
                                        onClick={() => handleConnectClick(hotel)}
                                        className="action-icon"
                                        title="Connect to Scrape Source"
                                    >
                                        <img
                                            src="/user/images/link.svg"
                                            alt="Connect"
                                            className="mx-1"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </a>
                                ) : (
                                    <span
                                        className="text-success small mx-1"
                                        title={connectionStatusText}
                                    >
                                        {connectionStatusText}
                                    </span>
                                ))}
                            {canAccess('delete') && (
                                <a
                                    href="#"
                                    onClick={() => handleDelete(hotel.id)}
                                    className="action-icon"
                                    title="Delete Hotel"
                                >
                                    <img
                                        src={`/user/images/deletetd.svg`}
                                        alt="Delete"
                                        className="mx-1"
                                    />
                                </a>
                            )}
                        </>
                    );
                },
            },
        });
    }

    const columns = baseColumns;

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
                ref={scrapeModalRef}
            >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="scrapeResultsModalLabel">
                                Connect Hotel: {currentHotelForScrape?.name}
                            </h4>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => setShowScrapeModal(false)}
                            >×</button>
                        </div>
                        <div className="modal-body">
                            {/* Collapse div for source selection */}
                            <div className="collapse" id="selectSourceCollapse" ref={collapseRef}>
                                <div className="card card-body mb-3">
                                    <p>Please select a source to connect:</p>
                                    <div className="d-flex justify-content-around">
                                        {/* Determine connection status for the current hotel in the modal */}
                                        {(() => {
                                            const isBookingComConnectedInModal = currentHotelForScrape?.ScrapeSourceHotels?.some(s => s.source_type === 'Booking.com');
                                            const isExpediaConnectedInModal = currentHotelForScrape?.ScrapeSourceHotels?.some(s => s.source_type === 'Expedia');

                                            return (
                                                <>
                                                    {/* Booking.com button */}
                                                    <button
                                                        type="button"
                                                        className={`btn ${isBookingComConnectedInModal ? 'btn-secondary' : 'btn-primary'}`}
                                                        onClick={() => handleSelectSource('booking.com')}
                                                        disabled={isBookingComConnectedInModal}
                                                    >
                                                        {isBookingComConnectedInModal ? 'Booking.com (Connected)' : 'Booking.com'}
                                                    </button>
                                                    {/* Expedia button */}
                                                    <button
                                                        type="button"
                                                        className={`btn ${isExpediaConnectedInModal ? 'btn-secondary' : 'btn-success'}`}
                                                        onClick={() => handleSelectSource('expedia')}
                                                        disabled={isExpediaConnectedInModal}
                                                    >
                                                        {isExpediaConnectedInModal ? 'Expedia (Connected)' : 'Expedia'}
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    {currentHotelForScrape?.ScrapeSourceHotels?.length > 0 && (
                                        <p className="text-success text-center mt-2">
                                            {currentHotelForScrape.ScrapeSourceHotels.length === 2
                                                ? 'Hotel is connected to both Booking.com and Expedia.'
                                                : `Hotel is connected to ${currentHotelForScrape.ScrapeSourceHotels[0].source_type}.`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Booking.com Scrape Results Display */}
                            {scrapeSource === 'booking.com' && (
                                <>
                                    {scrapingLoading && <p>Loading scraped data from Booking.com...</p>}
                                    {scrapingError && <p className="text-danger">Error: {scrapingError}</p>}

                                    {!scrapingLoading && scrapedResults.length === 0 && !scrapingError && (
                                        <p>No matching hotels found from Booking.com.</p>
                                    )}
                                    <div className="row">
                                        {scrapedResults.map((item, index) => (
                                            <div key={index} className="col-md-4 mb-3">
                                                <div className="card hotel_result h-100 d-flex flex-column">
                                                    <img
                                                        src={item.image_url || 'https://via.placeholder.com/150'}
                                                        className="card-img-top"
                                                        alt={item.hotel_name || 'Scraped Hotel Image'}
                                                        style={{ height: '150px', objectFit: 'cover' }}
                                                    />
                                                    <div className="card-body d-flex flex-column">
                                                        <h5 className="card-title">{item.hotel_name || 'N/A'}</h5>
                                                        <p className="card-text"><strong>City:</strong> <span>{item.city_name || 'N/A'}</span></p>
                                                        <p className="card-text"><strong>Source ID:</strong> <span>{item.dest_id || 'N/A'}</span></p>
                                                        <div className="mt-auto">
                                                            <button
                                                                type="button"
                                                                className="btn btn-info w-100"
                                                                onClick={() => handleSelectScrapedHotel(item, 'booking.com')}
                                                            >
                                                                Select
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Expedia Scrape Input and Results Display */}
                            {scrapeSource === 'expedia' && (
                                <>
                                    {!showExpediaResults ? (
                                        <div className="expedia-url-input">
                                            <div className="mb-3">
                                                <label htmlFor="expediaUrl" className="form-label">Enter Expedia Hotel URL:</label>
                                                <input
                                                    type="url"
                                                    className={`form-control ${expediaUrlError ? 'is-invalid' : ''}`}
                                                    id="expediaUrl"
                                                    value={expediaUrl}
                                                    onChange={(e) => {
                                                        setExpediaUrl(e.target.value);
                                                        setExpediaUrlError(''); // Clear error on change
                                                    }}
                                                    placeholder="e.g., https://www.expedia.com/Hotel-Name.h12345678.Hotel-Information"
                                                    required
                                                />
                                                {expediaUrlError && <div className="invalid-feedback">{expediaUrlError}</div>}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleExpediaUrlSubmit}
                                                disabled={scrapingLoading}
                                            >
                                                {scrapingLoading ? 'Scraping...' : 'Next'}
                                            </button>
                                        </div>
                                    ) : (
                                        expediaScrapedData && (
                                            <div className="expedia-result-display">
                                                {scrapingLoading && <p>Loading Expedia data...</p>}
                                                {scrapingError && <p className="text-danger">Error: {scrapingError}</p>}
                                                {!scrapingLoading && !scrapingError && (
                                                    <div className="card hotel_result mb-3">
                                                        <img
                                                            src={expediaScrapedData.image || 'https://via.placeholder.com/150'}
                                                            className="card-img-top"
                                                            alt={expediaScrapedData.name || 'Expedia Hotel Image'}
                                                            style={{ height: '200px', objectFit: 'cover' }}
                                                        />
                                                        <div className="card-body">
                                                            <h5 className="card-title">{expediaScrapedData.name || 'N/A'}</h5>
                                                            <button
                                                                type="button"
                                                                className="btn btn-info w-100"
                                                                onClick={() => handleSelectScrapedHotel(expediaScrapedData, 'expedia')}
                                                            >
                                                                Submit
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HotelsAndRoomsList;