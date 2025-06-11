// src/pages/Forecast/ForecastPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';

// Import local assets
import Filter from '../../assets/images/filter.svg';
import Canvas3 from '../../assets/images/canvas3.png';
import Canvas4 from '../../assets/images/canvas4.png';
import Canvas5 from '../../assets/images/canvas5.png';

// Chart.js imports (keep them if you plan to use react-chartjs-2 later)
// import { Line } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


const ForecastPage = () => {
    const [selectedHotel, setSelectedHotel] = useState('Hotel');
    const [selectedRoomType, setSelectedRoomType] = useState('Room Type');
    const [forecastData, setForecastData] = useState([]);
    const [occupancyChartData, setOccupancyChartData] = useState({});
    const [revparChartData, setRevparChartData] = useState({});
    const [adrChartData, setAdrChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dummy forecast data for demonstration
    const dummyForecasts = [
        { id: 1, date: '2025-06-05', dayOfWeek: 'Wednesday', roomType: 'Deluxe King', forecastedOccupancy: '78%', forecastedADR: '$145', forecastedRevPAR: '$113' },
        { id: 2, date: '2025-06-04', dayOfWeek: 'Tuesday', roomType: 'Deluxe King', forecastedOccupancy: '80%', forecastedADR: '$158', forecastedRevPAR: '$153' },
        { id: 3, date: '2025-06-06', dayOfWeek: 'Thursday', roomType: 'Deluxe King', forecastedOccupancy: '90%', forecastedADR: '$157', forecastedRevPAR: '$170' },
        { id: 4, date: '2025-06-08', dayOfWeek: 'Saturday', roomType: 'Deluxe King', forecastedOccupancy: '74%', forecastedADR: '$160', forecastedRevPAR: '$190' },
        { id: 5, date: '2025-06-07', dayOfWeek: 'Friday', roomType: 'Deluxe King', forecastedOccupancy: '68%', forecastedADR: '$157', forecastedRevPAR: '$213' },
    ];

    // Dummy chart data (you'd generate this from forecastData)
    const generateChartData = (forecasts, type) => {
        const labels = forecasts.map(f => f.date);
        let dataValues;
        switch (type) {
            case 'occupancy':
                dataValues = forecasts.map(f => parseFloat(f.forecastedOccupancy.replace('%', ''))); // Parse as float
                break;
            case 'adr':
                dataValues = forecasts.map(f => parseFloat(f.forecastedADR.replace('$', '')));
                break;
            case 'revpar':
                dataValues = forecasts.map(f => parseFloat(f.forecastedRevPAR.replace('$', '')));
                break;
            default:
                dataValues = [];
        }

        return {
            labels,
            datasets: [
                {
                    label: type.charAt(0).toUpperCase() + type.slice(1),
                    data: dataValues,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    tension: 0.1,
                    fill: false, // Ensure line chart doesn't fill by default
                },
            ],
        };
    };

    const columns = [
        { name: 'id', label: 'ID', options: { filter: false, sort: true, setCellHeaderProps: () => ({ style: { minWidth: '40px' } }) } },
        { name: 'date', label: 'Date', options: { filter: false, sort: true, setCellHeaderProps: () => ({ style: { minWidth: '100px' } }) } },
        { name: 'dayOfWeek', label: 'Day of Week', options: { filter: true, sort: false, setCellHeaderProps: () => ({ style: { minWidth: '130px' } }) } },
        { name: 'roomType', label: 'Room Type', options: { filter: true, sort: false, setCellHeaderProps: () => ({ style: { minWidth: '120px' } }) } },
        { name: 'forecastedOccupancy', label: 'Forecasted Occupancy', options: { filter: false, sort: false, setCellHeaderProps: () => ({ style: { minWidth: '120px' } }) } },
        { name: 'forecastedADR', label: 'Forecasted ADR', options: { filter: false, sort: false, setCellHeaderProps: () => ({ style: { minWidth: '100px' } }) } },
        { name: 'forecastedRevPAR', label: 'Forecasted RevPAR', options: { filter: false, sort: false, setCellHeaderProps: () => ({ style: { minWidth: '110px' } }) } },
    ];



    useEffect(() => {
        setLoading(true);
        setError(null);
        setTimeout(() => { // Simulate API call
            setForecastData(dummyForecasts);
            setOccupancyChartData(generateChartData(dummyForecasts, 'occupancy'));
            setRevparChartData(generateChartData(dummyForecasts, 'revpar'));
            setAdrChartData(generateChartData(dummyForecasts, 'adr'));
            setLoading(false);
        }, 500);

    }, [selectedHotel, selectedRoomType]); // Rerun when filters change


    const handleHotelChange = (event) => {
        setSelectedHotel(event.target.value);
    };

    const handleRoomTypeChange = (event) => {
        setSelectedRoomType(event.target.value);
    };

    // Corrected loading and error rendering
    if (loading) {
        return (
            <DashboardLayout>
                <div className="container-fluid text-center py-5">
                    <p>Loading forecast data...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="container-fluid text-danger text-center py-5">
                    <p>Error: {error.message}</p>
                </div>
            </DashboardLayout>
        );
    }

      const options = {
        selectableRows: 'none',
        search: true,
        download: true,
        print: false,
        viewColumns: true,
        filter: true,
        responsive: 'standard',
        pagination: true,
    };

    return (
        <DashboardLayout>
            <div className="mainbody">
                <div className="container-fluid">
                    <div className="row breadcrumbrow">
                        <div className="col-md-12">
                            <div className="breadcrumb-sec">
                                <h2>Forecast</h2>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb">
                                        <li className="breadcrumb-item"><a href="#">Home</a></li>
                                        <li className="breadcrumb-item active" aria-current="page">Forecast</li>
                                    </ol>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="white-bg form-design">
                        <form>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Hotel</label>
                                        <select className="form-select form-control" value={selectedHotel} onChange={handleHotelChange}>
                                            <option value="Hotel">Hotel</option>
                                            <option value="Hotel A">Hotel A</option>
                                            <option value="Hotel B">Hotel B</option>
                                            <option value="Hotel C">Hotel C</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label className="form-label">Room Type</label>
                                        <select className="form-select form-control" value={selectedRoomType} onChange={handleRoomTypeChange}>
                                            <option value="Room Type">Room Type</option>
                                            <option value="Deluxe King">Deluxe King</option>
                                            <option value="Standard Double">Standard Double</option>
                                            <option value="Suite">Suite</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="row forecast-canvas">
                            <div className="col-md-6">
                                <div className="canvas-heading">
                                    <h2>Occupancy Rate</h2>
                                    <div className="canvas-filter">
                                        <div className="dropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                                <img src={Filter} className="img-fluid" alt="Filter Icon" />
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li><a className="dropdown-item" href="#">Months</a></li>
                                                <li><a className="dropdown-item" href="#">Days</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="canvasbody">
                                    {/* Conditional rendering for Chart.js if you enable it */}
                                    {/* {occupancyChartData.labels && occupancyChartData.labels.length > 0 && (
                                        <Line data={occupancyChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }} }} />
                                    )} */}
                                    <img src={Canvas3} className="img-fluid" alt="Occupancy Rate Chart" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="canvas-heading">
                                    <h2>RevPAR</h2>
                                    <div className="canvas-filter">
                                        <div className="dropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                                <img src={Filter} className="img-fluid" alt="Filter Icon" />
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li><a className="dropdown-item" href="#">Months</a></li>
                                                <li><a className="dropdown-item" href="#">Week</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="canvasbody">
                                    {/* Conditional rendering for Chart.js if you enable it */}
                                    {/* {revparChartData.labels && revparChartData.labels.length > 0 && (
                                        <Line data={revparChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }} }} />
                                    )} */}
                                    <img src={Canvas4} className="img-fluid" alt="RevPAR Chart" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="canvas-heading">
                                    <h2>ADR</h2>
                                    <div className="canvas-filter">
                                        <div className="dropdown">
                                            <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                                                <img src={Filter} className="img-fluid" alt="Filter Icon" />
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li><a className="dropdown-item" href="#">Months</a></li>
                                                <li><a className="dropdown-item" href="#">Days</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="canvasbody">
                                    {/* Conditional rendering for Chart.js if you enable it */}
                                    {/* {adrChartData.labels && adrChartData.labels.length > 0 && (
                                        <Line data={adrChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }} }} />
                                    )} */}
                                    <img src={Canvas5} className="img-fluid" alt="ADR Chart" style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="forecasttable">
                            <div className="tabledesign">
                                <div className="table-responsive">
                                    <div className="forecasttable">
                                        <MUIDataTable
                                            title={"Forecast Data"}
                                            data={forecastData}
                                            columns={columns}
                                            options={options}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ForecastPage;