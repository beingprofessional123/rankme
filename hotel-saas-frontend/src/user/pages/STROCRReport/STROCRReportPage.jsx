import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermissionContext } from '../../UserPermission';
import axios from 'axios';
import { Link } from 'react-router-dom';

const STROCRReportPage = () => {
    const { user } = useContext(PermissionContext);
    const [hotels, setHotels] = useState([]);
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const getAuthToken = () => localStorage.getItem('token');

    const isDateRangeValid = useCallback(() => {
        if (!dateRange.start || !dateRange.end) return true;
        return new Date(dateRange.start) <= new Date(dateRange.end);
    }, [dateRange]);

    const fetchHotels = useCallback(async () => {
        try {
            const token = getAuthToken();
            const companyId = user?.company_id;
            if (!token || !companyId) throw new Error('Missing credentials');

            const res = await fetch(`${API_BASE_URL}/api/hotels/list?company_id=${companyId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) throw new Error(`Failed to fetch hotels (${res.status})`);
            const data = await res.json();
            setHotels(data.hotels || []);
        } catch (err) {
            toast.error(err?.message || 'Failed to fetch hotels');
        }
    }, [API_BASE_URL, user]);

    useEffect(() => {
        if (user?.company_id) fetchHotels();
    }, [fetchHotels, user]);

    const fetchSTROCRData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            if (!token || !selectedHotelId) {
                setError('Missing token or hotel selection.');
                return;
            }

            if (!isDateRangeValid()) {
                setError('Start date cannot be after end date.');
                return;
            }

            const params = {
                company_id: user?.company_id,
                user_id: user?.id,
                hotel_id: selectedHotelId,
            };

            if (dateRange.start) params.start_date = dateRange.start;
            if (dateRange.end) params.end_date = dateRange.end;

            const response = await axios.get(`${API_BASE_URL}/api/strocrReport/list`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            setReportData(response.data?.results || []);
        } catch (err) {
            console.error('Error fetching STR/OCR data:', err);
            setError('Failed to fetch STR/OCR report data.');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, selectedHotelId, dateRange, user, isDateRangeValid]);

    useEffect(() => {
        if (!(user?.company_id && user?.id && selectedHotelId)) return;
        if (!isDateRangeValid()) {
            return;
        }

        const handler = setTimeout(() => {
            fetchSTROCRData();
        }, 300);

        return () => clearTimeout(handler);
    }, [selectedHotelId, dateRange, user, fetchSTROCRData, isDateRangeValid]);

    const handleHotelChange = (e) => {
        setSelectedHotelId(e.target.value);
    };

    const handleDateChange = (field) => (e) => {
        setDateRange((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const formatTwoDecimals = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        const num = Number(value);
        if (isNaN(num)) return value;
        return num.toFixed(2);
    };

    const usdFormatter = useMemo(
        () =>
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
        []
    );
    const formatUSD = (value) => {
        if (value === null || value === undefined || value === '') return '-';
        const num = Number(value);
        if (isNaN(num)) return value;
        return usdFormatter.format(num);
    };

    const columns = [
        { name: 'date', label: 'Date' },
        {
            name: 'occupancy',
            label: 'Occupancy',
            options: {
                customBodyRender: (value) => formatTwoDecimals(value),
            },
        },
        {
            name: 'adr',
            label: 'ADR (USD)',
            options: {
                customBodyRender: (value) => formatUSD(value),
            },
        },
        {
            name: 'revpar',
            label: 'RevPAR (USD)',
            options: {
                customBodyRender: (value) => formatUSD(value),
            },
        },
        {
            name: 'total_revanue',
            label: 'Total Revenue (USD)',
            options: {
                customBodyRender: (value) => formatUSD(value),
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
        responsive: 'standard',
        pagination: true,
        textLabels: {
            body: {
                noMatch:
                    !selectedHotelId
                        ? '👉 Please select a hotel to view STR/OCR report.'
                        : loading
                        ? '🔄 Loading STR/OCR report...'
                        : error
                        ? `❌ Error: ${error}`
                        : '📭 No STR/OCR data found for the selected filters.',
            },
        },
    };

    const renderDateValidation = () => {
        if (!dateRange.start || !dateRange.end) return null;
        if (!isDateRangeValid()) {
            return (
                <div className="text-danger small mt-1">
                    Start date must be before or equal to end date.
                </div>
            );
        }
        return null;
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
                                <h2>STR/OCR Report</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item">
                                            <Link to="">Home</Link>
                                        </li>
                                        <li className="breadcrumb-item active" aria-current="page">
                                            STR/OCR Report
                                        </li>
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
                                                    disabled={loading}
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
                                                        onChange={handleDateChange('start')}
                                                        disabled={loading}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={dateRange.end}
                                                        onChange={handleDateChange('end')}
                                                        disabled={loading}
                                                    />
                                                </div>
                                                {renderDateValidation()}
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
                                    title="STR/OCR Report Data"
                                    data={reportData}
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

export default STROCRReportPage;
