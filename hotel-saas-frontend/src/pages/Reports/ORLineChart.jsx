import React from 'react';
import { Line } from 'react-chartjs-2';
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

const ORLineChart = ({ data }) => {
  if (!data || data.length === 0) return <p>No data available</p>;

  const labels = data.map(item => item.date);

  const occupancy = data.map(item => parseFloat(item.occupancy?.replace('%', '') || 0));
  const roomsAvailable = data.map(item => item.roomsAvailable);
  const roomsSold = data.map(item => item.roomsSold);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Occupancy %',
        data: occupancy,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Rooms Available',
        data: roomsAvailable,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Rooms Sold',
        data: roomsSold,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Occupancy Report Overview',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default ORLineChart;
