import { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const StatsChart = ({vault, vaultDetails}) => {
  
  const options = {
      maintainAspectRatio: false,
      indexAxis: 'x',
      scales: {
        y: {
          display: true,
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
        },
        x: {
          display: true,
        }
      },
    plugins: {
      legend: {
        position: 'top' ,
        display: true,
      },
      title: {
        display: true,
        text: 'Historical Performance',
      },
    }
  };
  
  const data = {
    labels: vaultDetails.history.map(item => { return (new Date(item.day*86400000)).toLocaleDateString('en-GB').substring(0, 5)}),
    datasets: [
      {
        label: 'Fees APR',
        data: vaultDetails.history.map(item => {return item.feesX8 / item.tvlX8 * 36500}),
        borderColor: 'rgba(254, 73, 88, 0.7)',
        backgroundColor: 'rgba(255, 99, 132, 0)',
        yAxisID: 'y',
      },
      {
        label: 'Vault price',
        data: vaultDetails.history.map(item => {return item.vaultPrice/1e8}),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };
  
  return (
    <div style={{ position: 'relative', height: 280 }}>
      <Line height={300} options={options} data={data} />
    </div>
  )
}

export default StatsChart;