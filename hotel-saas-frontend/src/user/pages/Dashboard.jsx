// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import DashboardLayout from '../components/DashboardLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestAlert, setLatestAlert] = useState('No new alerts.'); // ✅ ADDED: State for latest alert

  // Get user and token from local storage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  useEffect(() => {
    // Function to fetch the list of hotels
    const fetchHotels = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/hotels/list?company_id=${user.company_id}`,
          config
        );
        const fetchedHotels = res.data.hotels;
        setHotels(fetchedHotels);
        if (fetchedHotels.length > 0) {
          // Automatically set the first hotel as selected
          setSelectedHotelId(fetchedHotels[0].id);
        } else {
          setLoading(false);
          setError("No hotels found for your company.");
        }
      } catch (err) {
        setLoading(false);
        setError("Failed to fetch hotels list.");
        console.error("Error fetching hotels:", err);
      }
    };
    fetchHotels();
  }, [user.company_id]);

  useEffect(() => {
    // Function to fetch dashboard data for the selected hotel
    const fetchDashboardData = async () => {
      if (!selectedHotelId) {
        return; // Don't fetch if no hotel is selected
      }

      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/dashboard/data/${selectedHotelId}`,
          config
        );
        setDashboardData(res.data);
      } catch (err) {
        setError("Failed to fetch dashboard data.");
        console.error("Error fetching dashboard data:", err);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [selectedHotelId]);

  // ✅ NEW: Fetch notifications and update the latestAlert state
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/notifications`,
          config
        );
        const notifications = response.data.results;
        if (notifications && notifications.length > 0) {
          const latest = notifications[0]; // Assuming the API returns notifications in descending order of creation
          const message = latest.message;
          const charLimit = 50; // Set your character limit
          const truncatedMessage = message.length > charLimit 
                                 ? `${message.substring(0, charLimit)}...` 
                                 : message;
          setLatestAlert(truncatedMessage);
        } else {
          setLatestAlert("No new alerts.");
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setLatestAlert("Failed to fetch alerts.");
      }
    };
    fetchNotifications();
  }, []); // Empty dependency array means this runs once on component mount

  const handleHotelChange = (e) => {
    setSelectedHotelId(e.target.value);
  };

  const occupancyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      }
    }
  };

  const revparOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mainbody">
           <div className="container-fluid">
              <h3>Loading dashboard...</h3>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mainbody">
           <div className="container-fluid">
                  <h3>{error}</h3>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mainbody">
        <div className="container-fluid">
          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec d-flex justify-content-between align-items-center">
                <h2>Dashboard</h2>
                <div className="form-group w-25">
                  <select
                    className="form-control"
                    value={selectedHotelId}
                    onChange={handleHotelChange}
                  >
                    {hotels.length > 0 ? (
                      hotels.map((hotel) => (
                        <option key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No Hotels Available</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="card-bg">
                <div className="row">
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card1.svg`} className="img-fluid" alt="" /></span>
                      <h3>{dashboardData?.currentMetrics?.occupancy ? `${Math.round(dashboardData.currentMetrics.occupancy)}%` : '0%'}</h3>
                      <h5>Occupancy</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card2.svg`} className="img-fluid" alt="" /></span>
                      <h3>{dashboardData?.currentMetrics?.adr ? `${Math.round(dashboardData.currentMetrics.adr)}` : '0'}</h3>
                      <h5>ADR</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card3.svg`} className="img-fluid" alt="" /></span>
                      <h3>{dashboardData?.currentMetrics?.revpar ? `$${Math.round(dashboardData.currentMetrics.revpar)}` : '0'}</h3>
                      <h5>RevPAR</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card4.svg`} className="img-fluid" alt="" /></span>
                      {/* ✅ UPDATED: Display the latest alert from state */}
                      <h6>{latestAlert}</h6> 
                      <h5>Alerts <a href="#" className="alerts-read"></a></h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="white-bg">
                <div className="canvas-heading">
                  <h2>Occupancy Rate</h2>
                </div>
                <div className="canvasbody">
                  {dashboardData?.occupancyData ? (
                    <Line data={dashboardData.occupancyData} options={occupancyOptions} />
                  ) : (
                    <div className="text-center p-5">No occupancy data available.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="white-bg">
                <div className="canvas-heading">
                  <h2>RevPAR</h2>
                </div>
                <div className="canvasbody">
                  {dashboardData?.revparData ? (
                    <Bar data={dashboardData.revparData} options={revparOptions} />
                  ) : (
                    <div className="text-center p-5">No RevPAR data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;