// src/pages/Dashboard/Dashboard.jsx
import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
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

import DashboardLayout from '../components/DashboardLayout'; // Corrected path based on typical React project structure

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
  // Sample data for charts
  const occupancyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      label: 'Occupancy Rate',
      data: [35.6, 25.5, 50, 45.3, 44.6, 49.9, 70, 63, 67, 24, 40, 57],
      borderColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      fill: false,
      tension: 0.3,
    }]
  };

  const revparData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'RevPAR',
      data: [600, 800, 750, 800, 1000, 600, 1200],
      backgroundColor: '#facc15', // Corrected class to backgroundColor
    }]
  };

  return (
    <DashboardLayout>

      <div className="mainbody">
        <div className="container-fluid">

          <div className="row breadcrumbrow">
            <div className="col-md-12">
              <div className="breadcrumb-sec">
                <h2>Dashboard</h2>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="#">Home</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Dashboard</li>
                  </ol>
                </nav>
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
                      <h3>80%</h3>
                      <h5>Occupancy</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card2.svg`} className="img-fluid" alt="" /></span>
                      <h3>600</h3>
                      <h5>ADR</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card3.svg`} className="img-fluid" alt="" /></span>
                      <h3>$5,677</h3>
                      <h5>RevPAR</h5>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="carddesign">
                      <span className="card-icon"><img src={`/user/images/card4.svg`}className="img-fluid" alt="" /></span>
                      <h6>Lorem Ipsum is....</h6>
                      <h5>Alerts <a href="#" className="alerts-read">Read More</a></h5>
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
                  <div className="canvas-filter">
                    <div className="dropdown">
                      <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <img src={`/user/images/filter.svg`} className="img-fluid" alt="" />
                      </button>
                      <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#">Months</a></li>
                        <li><a className="dropdown-item" href="#">Days</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="canvasbody">
                  {/* Replace with actual ChartJS Line component */}
                  {/* <Line data={occupancyData} options={{ responsive: true, plugins: { legend: { position: 'top' }} }} /> */}
                  <img src={`/user/images/canvas1.png`} className="img-fluid" alt="Occupancy Rate Chart" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="white-bg">
                <div className="canvas-heading">
                  <h2>RevPAR</h2>
                  <div className="canvas-filter">
                    <div className="dropdown">
                      <button type="button" className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <img src={`/user/images/filter.svg`} className="img-fluid" alt="" />
                      </button>
                      <ul className="dropdown-menu">
                        <li><a className="dropdown-item" href="#">Months</a></li>
                        <li><a className="dropdown-item" href="#">Week</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="canvasbody">
                  {/* Replace with actual ChartJS Bar component */}
                  {/* <Bar data={revparData} options={{ responsive: true, plugins: { legend: { position: 'top' }} }} /> */}
                  <img src={`/user/images/canvas1.png`} className="img-fluid" alt="RevPAR Chart" style={{ width: '100%' }} />
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