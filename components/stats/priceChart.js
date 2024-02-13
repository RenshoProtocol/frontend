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

const StatsChart = ({vault, showPriceNotFees, gevault}) => {
  const [geData, setGeData] = useState([])
  
  useEffect(() => {
    const getData = async () => {
      try {
        const histData = await axios.get("https://roe.nicodeva.xyz/stats/arbitrum/history.json");
        console.log(histData)
        if (histData.data && histData.data[gevault.address]){
          console.log(histData.data[gevault.address])
          setGeData(histData.data[gevault.address])
        }
      } catch(e){
        console.log("Fetch historical data", e)
      }
    }
    if (gevault && gevault.address) getData()
  }, [gevault.address])
  
  const options = {
      maintainAspectRatio: false,
      indexAxis: 'x',
      scales: {
        y: {
           display: true,
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
        text: gevault.name,
      },
    }
  };
  
  const data = {
    labels: geData.map(item => { return (new Date(item.date*1000)).toLocaleDateString('en-GB').substring(0, 5)}),
  };
  
  
  const randomColor = Math.floor(Math.random()*256); // random + #A00000 to avoid too dark colors
  console.log(randomColor)

  if (showPriceNotFees){
    data.datasets = [
      {
        label: gevault.name + ' token price',
        data: geData.map(item => item.price),
        borderColor: 'hsl('+randomColor+',100%, 50%)',
        backgroundColor: 'rgba(255, 99, 132, 0)',
      },
    ]
  }
  else {
    data.datasets = [
      {
        label: 'Supply APR',
        data: geData.map(item => item.supplyRate),
        borderColor: 'rgba(254, 73, 88, 0.7)',
        backgroundColor: 'rgba(255, 99, 132, 0)',
      },
      {
        label: 'Fees APR',
        data: geData.map(item => item.feesRate),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Total APR',
        data: geData.map(item => {return item.feesRate+item.supplyRate}),
        borderColor: 'rgba(14, 192, 82)',
        backgroundColor: 'rgba(14, 192, 82, 0.5)',
      },
    ]
  }
  
  
  
  return (
    <div style={{ position: 'relative', height: 280 }}>
      <Line height={300} options={options} data={data} />
    </div>
  )
}

export default StatsChart;