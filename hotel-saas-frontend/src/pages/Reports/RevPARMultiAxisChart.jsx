import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RevPARMultiAxisChart = ({ data }) => {
  const labels = data.map(d => d.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'RevPAR ($)',
        data: data.map(d => d.RevPAR),
        yAxisID: 'y1',
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
      },
      {
        label: 'ADR ($)',
        data: data.map(d => d.adr),
        yAxisID: 'y1',
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.3,
      },
      {
        label: 'Occupancy %',
        data: data.map(d => d.Occupancy),
        yAxisID: 'y2',
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: { display: true, text: 'RevPAR vs ADR vs Occupancy %' },
      legend: { position: 'top' },
    },
    scales: {
      y1: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Dollars ($)' },
      },
      y2: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Occupancy (%)' },
        grid: { drawOnChartArea: false }, // keep it clean
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default RevPARMultiAxisChart;
