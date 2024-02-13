import { useState, useEffect } from 'react'
import { Dropdown, Button, Card } from 'antd'
import axios from 'axios'
import VaultsDropdown from './vaultsDropdown'
import useOraclePrice from "../../hooks/useOraclePrice";
import ORACLE_ABI from "../../contracts/GoodEntryOracle.json";
import {ethers} from 'ethers'

const Infobar = ({vaults, current, selectVault, oiInfo }) => {
  let [dailyCandle, setDailyCandle] = useState({})
  let [volatility, setVolatility] = useState(50)
  let [isDropdownVisible, setDropdownvisible ] = useState(false)
  let vault = vaults[current];
  
  const price = useOraclePrice(vaults[current]);

  useEffect( () => {
    // get candles from geckoterminal
    async function getData() {
      try {
        let apiUrl = vault.ohlcUrl + 'D&limit=1'
        const data = await axios.get(apiUrl, {withCredentials: false,})
        let candles = []
        // bybit format
        let dailyCandle = data.data.result.list[0]
        // push price up to main page
        setDailyCandle(dailyCandle)
      } catch(e) {console.log(e)}
    }
    const intervalId = setInterval(() => {
      if (vault.ohlcUrl) getData();
    }, 20000);
    return () => { clearInterval(intervalId); };
  }, [vault.ohlcUrl])
  
  
  useEffect(()=> {
    const getVol = async () => {
      try {
        const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
        const oracleContract = new ethers.Contract("0x4A9EB72b72cB6fBbD8eF8C83342f252e519559e9", ORACLE_ABI, customProvider);
        let v = await oracleContract.getAdjustedVolatility(vault.baseToken.address, 0)
        setVolatility(ethers.utils.formatUnits(v, 8))
      } catch(e) {
        console.log('get vol', e)
      }
    }
    if(vault.address) getVol()
  }, [vault.address])

  let change = parseFloat(dailyCandle[1]) - parseFloat(dailyCandle[4])
  let changePercent = 100 * change / ( parseFloat(dailyCandle[1]) || 1 )

  let red = '#e57673' 
  let green = '#55d17c'
  
  let oiCall = oiInfo.callOI < oiInfo.callMax ? oiInfo.callOI / oiInfo.callMax * 100 : 100
  let oiPut = oiInfo.putOI < oiInfo.putMax ? oiInfo.putOI / oiInfo.putMax * 100 : 100
  
  return (<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 40 }}>
    <VaultsDropdown selectVault={selectVault} vaults={vaults} currentVault={vault} />
    
    <span style={{ fontSize: 'larger', color: 'white' }}>{price.toFixed(3)}</span>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h Change</span>
      <span style={{ color: change > 0 ? green:red }}>{change.toFixed(2)} {changePercent.toFixed(2)}%</span>
    </div> 
    
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h High</span>
      <span style={{ color: 'white' }}>{parseFloat(dailyCandle[2]??0).toFixed(2)}</span>
    </div> 
    
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>24h Low</span>
      <span style={{ color: 'white'}}>{parseFloat(dailyCandle[3]??0).toFixed(2)}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>Volatility</span>
      <span style={{ color: 'white'}}>{parseFloat(volatility * 100).toFixed(2)}%</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>Open Interest (L)</span>
      <span style={{ color: 'white'}}>{parseFloat(oiCall).toFixed(2)}%</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <span style={{ fontSize: 'small', color: 'grey' }}>Open Interest (S)</span>
      <span style={{ color: 'white'}}>{parseFloat(oiPut).toFixed(2)}%</span>
    </div>
  </div>)
  
  
}


export default Infobar;