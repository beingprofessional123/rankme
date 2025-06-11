import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ForecastAccuracyChart = ({ data }) => {
  const labels = data.map(d => d.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Forecasted Occupancy (%)',
        data: data.map(d => d.forecastedOccupancy),
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // blue
      },
      {
        label: 'Actual Occupancy (%)',
        data: data.map(d => d.actualOccupancy),
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // green
      },
      {
        label: 'Forecasted Revenue ($)',
        data: data.map(d => d.forecastedRevenue),
        backgroundColor: 'rgba(255, 206, 86, 0.6)', // yellow
      },
      {
        label: 'Actual Revenue ($)',
        data: data.map(d => d.actualRevenue),
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // red
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Forecast vs Actual (Occupancy and Revenue)',
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default ForecastAccuracyChart;
