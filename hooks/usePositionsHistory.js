import { useEffect, useState } from "react";
import axios from "axios";


const usePositionsHistory = (account, refresh) => {
  const [data, setdata] = useState([]);
  // get 
  /* https://api.arbiscan.io/api?module=logs&action=getLogs
       &toBlock=22524653
       &topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
       &topic0_1_opr=and
       &topic1=0x0000000000000000000000000000000000000000000000000000000000000000
       &page=1
       &offset=1000
       &apikey=YourApiKeyToken
  */
  var url = ""
  
  useEffect(() => {
    const getData = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      //console.log('Check history')
      try {
        const url = "https://api.arbiscan.io/api?module=logs&action=getLogs&topic0=0xc6ec1e16b7b639fb4e5dfccd3a9134b7190008e32a93758705a829394bae907a&topic0_1_opr=and&apiKey=BYUIRGM2YBGEM36ZSC7PWW7DTAP8FY2KIW&topic1=0x000000000000000000000000"+account.substring(2,42)

        var dataraw = (await axios.get(url)).data.result;
        setdata(dataraw)
      }
      catch(e) {
        console.log("PositionsHistory data", e)
      }
    }
    if (account) getData();
  }, [account, refresh]);
  return data;
}

export default usePositionsHistory;