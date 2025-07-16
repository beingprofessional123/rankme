import React, { useState, useEffect, useContext, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermissionContext } from '../../UserPermission';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BookingPage = () => {
    const { user } = useContext(PermissionContext);
    const [hotels, setHotels] = useState([]);
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [bookingData, setBookingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const getAuthToken = () => localStorage.getItem('token');

    // ✅ Fetch Hotels List
    const fetchHotels = useCallback(async () => {
        try {
            const token = getAuthToken();
            const companyId = user?.company_id;
            if (!token || !companyId) throw new Error('Missing credentials');

            const res = await fetch(
                `${API_BASE_URL}/api/hotels/list?company_id=${companyId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const data = await res.json();
            setHotels(data.hotels || []);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch hotels');
        }
    }, [API_BASE_URL, user]);

    useEffect(() => {
        if (user?.company_id) fetchHotels();
    }, [fetchHotels, user]);

    // ✅ Fetch Bookings
    const fetchBookings = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token || !selectedHotelId) {
                setError('Missing token or hotel selection.');
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/bookings/list`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    company_id: user?.company_id,
                    user_id: user?.id,
                    hotel_id: selectedHotelId,
                    ...(dateRange.start && dateRange.end && {
                        start_date: dateRange.start,
                        end_date: dateRange.end,
                    }),
                },
            });

            const extractedRows =
                response.data?.results?.flatMap(item =>
                    item.extractedFiles.map(file => ({
                        check_in: file.checkIn,
                        check_out: file.checkOut,
                        room_type: file.roomType,
                        rate: file.rate,
                        source: file.source,
                    }))
                ) || [];

            setBookingData(extractedRows);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Failed to fetch bookings. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.company_id && user?.id && selectedHotelId) {
            fetchBookings();
        }
    }, [selectedHotelId, dateRange, user]);

    const handleHotelChange = (e) => {
        setSelectedHotelId(e.target.value);
    };

    const columns = [
        { name: 'check_in', label: 'Check-in' },
        { name: 'check_out', label: 'Check-out' },
        { name: 'room_type', label: 'Room Type' },
        { name: 'rate', label: 'Rate' },
        { name: 'source', label: 'Source' },
    ];

    const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        responsive: 'standard',
        pagination: true,
        textLabels: {
            body: {
                noMatch:
                    !selectedHotelId
                        ? '👉 Please select a hotel to view bookings.'
                        : loading
                            ? '🔄 Loading booking data...'
                            : error
                                ? `❌ Error: ${error}`
                                : '📭 No bookings found for the selected filters.',
            },
        },
    };

    return (
        <DashboardLayout>
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="mainbody">
                <div className="container-fluid">
                    {/* Breadcrumb */}
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Bookings</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><Link to=''>Home</Link></li>
                                        <li className="breadcrumb-item active" aria-current="page">Bookings</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    {/* Filters */}
                    <div className="row">
                        <div className="col-md-12">
                            <div className="white-bg form-design">
                                <form>
                                    <div className="row calendarfilter">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Hotel</label>
                                                <select
                                                    className="form-select form-control"
                                                    onChange={handleHotelChange}
                                                    value={selectedHotelId}
                                                >
                                                    <option value="">Select Hotel</option>
                                                    {hotels.map((hotel) => (
                                                        <option key={hotel.id} value={hotel.id}>
                                                            {hotel.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label className="form-label">Date Range</label>
                                                <div className="daterange d-flex gap-2 align-items-center">
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={dateRange.start}
                                                        onChange={(e) =>
                                                            setDateRange((prev) => ({ ...prev, start: e.target.value }))
                                                        }
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={dateRange.end}
                                                        onChange={(e) =>
                                                            setDateRange((prev) => ({ ...prev, end: e.target.value }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="white-bg mt-4">
                        <div className="tabledesign">
                            <div className="table-responsive">
                                <MUIDataTable
                                    title="Booking List"
                                    data={bookingData}
                                    columns={columns}
                                    options={options}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BookingPage;
