import { useState, useEffect } from "react";
import { Card, Typography } from 'antd';
import useAddresses from "../hooks/useAddresses";  
import GEPM_ABI from "../contracts/GoodEntryPositionManager.json";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";

// Display all user assets and positions in all ROE LPs
const Positions = () => {
  const [positions, setPositions] = useState([])
  const [stats, setStats] = useState({})
  const ADDRESSES = useAddresses();
  let vaults = ADDRESSES["lendingPools"];
  const { library, account, chainId } = useWeb3React();

  useEffect(()=>{
    const getData = async() => {
      console.log(vaults, library, account)
      let stat = {}
      let pos = []
      for (let vault of vaults){
        let pmContract = new ethers.Contract(vault.positionManagerV2, GEPM_ABI, library.getSigner(account));
        let nftSupply = await pmContract.totalSupply();
        let callUtilizationRate = await pmContract.getUtilizationRate(true, 0)
        let putUtilizationRate = await pmContract.getUtilizationRate(false, 0)

        stat[vault.address] = {
          totalSupply: nftSupply.toNumber(), 
          name: vault.name,          
          callUtilizationRate: callUtilizationRate.toNumber(),
          putUtilizationRate: putUtilizationRate.toNumber(),
        }
        for (let k = 0; k< nftSupply; k++){
          let positionId = await pmContract.tokenByIndex(k);
          let onePos = await pmContract.getPosition(positionId)
          let owner = await pmContract.ownerOf(positionId)
          
          // optionType == 0: fixed option: data field gives endDate, after which 3rd party can close
          // OptionType == 1: streaming: function getFeesAccumulated(uint tokenId) public view returns (uint feesAccumulated), if feesAccumulated > collateralAmount -> can liquidate
          // feesDue >= position.collateralAmount - FIXED_EXERCISE_FEE // can get FIXED_EXERCISE_FEE with pm.getParameters, now it is 4e6 = 4 USDC
          let feesAccumulated = onePos.optionType == 1 ? await pmContract.getFeesAccumulated(positionId) : 0
          let notionalDecimals = onePos.isCall ? vault.baseToken.decimals : vault.quoteToken.decimals
          let realEndDate = onePos.endDate
          if (onePos.optionType == 1){
            let runway = (onePos.collateralAmount - 4e6 - feesAccumulated) / onePos.data * 1e10;
            realEndDate = new Date().getTime() + runway * 1000;
            
          }
 
          pos.push({
            positionId: positionId, 
            pmAddress: vault.positionManagerV2, 
            name: vault.name, 
            feesAccumulated: feesAccumulated, 
            notionalDecimals: notionalDecimals,
            realEndDate: realEndDate,
            owner: owner,
            ...onePos
          })
        }
      }
      setPositions(pos)
      setStats(stat)
      
    }
    if(library && account) getData()
  }, [vaults.length, account])
  
  
  const closePosition = async (pmAddress, positionId) => {
    let pmContract = new ethers.Contract(pmAddress, GEPM_ABI, library.getSigner(account));
    await pmContract.closePosition(positionId)
  }
  
  return (<div style={{ minWidth: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <img src="/images/1500x500.jpg" alt="Banner" width="300" height="100" style={{borderRadius: 5}}/>

    <Card style={{ width: 1200, marginTop: 24}} >
      <div style={{display: "flex", direction: "row", gap: 48}}>
        {
          Object.keys(stats).map( i => { return (<div key={stats[i].name}>
            <strong>Vault {stats[i].name}</strong><br/>
            Positions: {stats[i].totalSupply} NFTs<br/>
            Call u.rate: {stats[i].callUtilizationRate}%<br/>
            Put u.rate: {stats[i].putUtilizationRate}%<br/>
          </div>) })
        }
      </div>
      <table>
        <thead>
          <tr>
            <th align="left">Vault</th>
            <th align="left">PosId</th>
            {/*<th align="left">Type</th>*/}
            <th align="left">Ticker</th>
            <th align="left">Notional</th>
            <th align="left">Collat.$</th>
            <th align="left">Fees.Accum</th>
            <th align="left">StartDate</th>
            <th align="left">EndDate</th>
            <th align="right">Action</th>
          </tr>
        </thead>
        <tbody>
          {
            positions.map( (p) => {
              let canLiq = false;
              if (p.optionType == 0){
                let dd = new Date().getTime() / 1000;
                if (dd > p.data) canLiq = true
              } else if (p.optionType == 1){
                if (p.feesAccumulated > p.collateralAmount - 4e6) canLiq = true
              }

              let k = p.pmAddress+p.positionId.toString();
              return (<tr key={k}>
                <td>{p.name}</td>
            <td><a href={"https://arbiscan.io/address/"+p.owner}>{p.positionId.toString()}</a></td>
                  {/*<td>{p.optionType.toString()}</td>*/}
                <td>{p.isCall ? "long":"short"} {(p.strike / 1e8)}</td>
                <td>{(p.notionalAmount / 10**p.notionalDecimals).toFixed(4).replace(/\.0+$/, '')}</td>
                <td>{((p.collateralAmount - 4e6)/1e6).toString()}</td>
                <td>{p.feesAccumulated.toString()} ({(100*p.feesAccumulated/(p.collateralAmount - 4e6)).toFixed(2)}%)</td>
                <td>{new Date(p.startDate*1000).toLocaleString()}</td>
                <td>{new Date(p.realEndDate).toLocaleString()}</td>
                <td align="right">
                  <button style={{ border: 0, backgroundColor: (canLiq ? "green" : "gray")}} onClick={()=>{closePosition(p.pmAddress, p.positionId)}} >Close</button>
                </td>
              </tr>)
            })
          }
        </tbody>
      </table>
    </Card>

  </div>);
  
}

export default Positions;