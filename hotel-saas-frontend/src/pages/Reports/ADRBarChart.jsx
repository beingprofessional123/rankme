import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ADRBarChart = ({ data }) => {
  // Handle empty or undefined data gracefully
  if (!data || data.length === 0) return <p>No data available</p>;

  const labels = data.map(item => item.date);

  const roomsSold = data.map(item => item.roomsAvailable); // Adjust if needed
  const totalRevenue = data.map(item => item.roomsSold);   // Adjust if needed
  const adrPercent = data.map(item => parseFloat(item.adr?.replace('%', '') || 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Rooms Sold',
        data: roomsSold,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
      {
        label: 'Total Revenue ($)',
        data: totalRevenue,
        backgroundColor: 'rgba(255, 206, 86, 0.7)',
      },
      {
        label: 'ADR %',
        data: adrPercent,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Hotel Performance Report',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default ADRBarChart;
