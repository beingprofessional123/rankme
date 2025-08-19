import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import MUIDataTable from 'mui-datatables';
import Select from 'react-select';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ForecastPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [forecastData, setForecastData] = useState([]);
  const [occupancyChartData, setOccupancyChartData] = useState({});
  const [revparChartData, setRevparChartData] = useState({});
  const [adrChartData, setAdrChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Fetch hotel list dynamically
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${user.company_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await res.json();
        if (data && Array.isArray(data.hotels)) {
          setHotels(data.hotels);
        } else {
          setHotels([]);
        }
      } catch (err) {
        console.error(err);
        setHotels([]);
      }
    };
    fetchHotels();
  }, []);

  // Handle start date change and auto-generate end date (+14 days)
  const handleStartDateChange = (e) => {
    const start = e.target.value;
    setStartDate(start);
    if (start) {
      const startObj = new Date(start);
      startObj.setDate(startObj.getDate() + 14);
      const end = startObj.toISOString().split('T')[0];
      setEndDate(end);
    } else {
      setEndDate('');
    }
  };

  // Generate chart data from API response
  const generateChartData = (forecasts, type) => {
    if (!forecasts || forecasts.length === 0) {
      return {};
    }
    const labels = forecasts.map((f) => f.date);
    let dataValues;
    switch (type) {
      case 'occupancy':
        dataValues = forecasts.map((f) => parseFloat(f.forecastedOccupancy.replace('%', '')));
        break;
      case 'adr':
        dataValues = forecasts.map((f) => parseFloat(f.forecastedADR.replace('$', '')));
        break;
      case 'revpar':
        dataValues = forecasts.map((f) => parseFloat(f.forecastedRevPAR.replace('$', '')));
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
          fill: false,
        },
      ],
    };
  };

  // Fetch forecast when both hotel and startDate are selected
  useEffect(() => {
    const fetchForecastData = async () => {
      if (!selectedHotelId || !startDate) {
        setForecastData([]);
        setOccupancyChartData({});
        setRevparChartData({});
        setAdrChartData({});
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams();
        queryParams.append('hotelId', selectedHotelId);
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/forecast/list?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!res.ok) {
          throw new Error('Failed to fetch forecast data.');
        }
        const data = await res.json();
        setForecastData(data);
        setOccupancyChartData(generateChartData(data, 'occupancy'));
        setRevparChartData(generateChartData(data, 'revpar'));
        setAdrChartData(generateChartData(data, 'adr'));
      } catch (err) {
        console.error('Error fetching forecast data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecastData();
  }, [selectedHotelId, startDate, endDate]);

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

  // UPDATED: Added ADR and RevPAR columns
  const columns = [
    { name: 'date', label: 'Date', options: { filter: false, sort: true } },
    { name: 'forecastedOccupancy', label: 'Forecasted Occupancy', options: { filter: false, sort: false } },
    { name: 'forecastedADR', label: 'Forecasted ADR', options: { filter: false, sort: false } },
    { name: 'forecastedRevPAR', label: 'Forecasted RevPAR', options: { filter: false, sort: false } },
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
                    <li className="breadcrumb-item">
                      <a href="#">Home</a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Forecast
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="white-bg form-design">
            <form>
              <div className="row">
                {/* Hotel Single-Select */}
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Hotel</label>
                    <Select
                      value={hotels
                        .map((h) => ({ label: h.name, value: h.id }))
                        .find((opt) => opt.value === selectedHotelId)}
                      onChange={(selectedOption) => {
                        setSelectedHotelId(selectedOption ? selectedOption.value : null);
                        setStartDate('');
                        setEndDate('');
                      }}
                      options={[
                        { value: '', label: 'Please select...' },
                        ...hotels.map((h) => ({ label: h.name, value: h.id })),
                      ]}
                    />
                  </div>
                </div>

                {/* Start Date */}
                <div className="col-md-3">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={handleStartDateChange}
                      disabled={!selectedHotelId} // disable until hotel is selected
                      min={today}
                    />
                  </div>
                </div>

                {/* End Date (Disabled) */}
                <div className="col-md-3">
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" className="form-control" value={endDate} disabled />
                  </div>
                </div>
              </div>
            </form>

            {/* Charts */}
            <div className="row forecast-canvas">
              <div className="col-md-6">
                <div className="canvas-heading">
                  <h2>Occupancy Rate</h2>
                </div>
                <div className="canvasbody">
                  {occupancyChartData.labels && occupancyChartData.labels.length > 0 && (
                    <Line
                      data={occupancyChartData}
                      options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="canvas-heading">
                  <h2>RevPAR</h2>
                </div>
                <div className="canvasbody">
                  {revparChartData.labels && revparChartData.labels.length > 0 && (
                    <Line
                      data={revparChartData}
                      options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-12">
                <div className="canvas-heading">
                  <h2>ADR</h2>
                </div>
                <div className="canvasbody">
                  {adrChartData.labels && adrChartData.labels.length > 0 && (
                    <Bar
                      data={adrChartData}
                      options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="forecasttable">
              <MUIDataTable
                title={'Forecast Data'}
                data={forecastData}
                columns={columns}
                options={options}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ForecastPage;