import { ethers } from "ethers";
import {useState, useEffect} from "react"
import useContract from "../../hooks/useContract";
import useAddresses from "../../hooks/useAddresses";
import GoodEntryPositionManager_ABI from "../../contracts/GoodEntryPositionManager.json";


const HistoryTx = ({tx}) => {
  const [position, setPosition] = useState({})

  let addresses = useAddresses()
  let vault = { baseToken: {}, quoteToken: {} }
  
  for (let v of addresses.lendingPools){
    if (v.positionManagerV2.toLowerCase() == tx.address.toLowerCase()) vault = v
  }

  const iface = new ethers.utils.Interface(["event ClosedPosition(address indexed user, address closer, uint tokenId, int pnl)"])
  const data = iface.decodeEventLog("ClosedPosition", tx.data)

  const pmContract = useContract(vault.positionManagerV2, GoodEntryPositionManager_ABI);

  useEffect(() => {
    const getPosition = async () => {
      try {
        const pos = await pmContract.getPosition(data.tokenId)
        setPosition(pos)
      }
      catch(e) {console.log("Error fetching NFTs", e)}
    };

    if (vault.positionManagerV2 && pmContract) getPosition();
  }, [data.tokenId.toNumber(), vault.positionManagerV2, pmContract]);

  if (position.startDate == 0) return <></>
  
  //console.log(tx.transactionHash, position, position.notionalAmount.toString(), data)
  return (<tr>
    <td>{new Date(position.startDate * 1000 ?? 0).toLocaleString()}</td>
    <td><a href={"https://arbiscan.io/tx/"+tx.transactionHash} target="_blank" rel="noreferrer" >{tx.transactionHash.substring(0,8)}...</a></td>
    <td>{vault.baseToken.name}</td>
    <td>{position.isCall ? <span style={{color: "#10da5d"}}>LONG</span> : <span style={{color: "rgb(229, 118, 115)"}}>SHORT</span>}</td>
    <td>{position.strike / 1e8}</td>
    <td>{(position.notionalAmount / 10**(position.isCall ? vault.baseToken.decimals : vault.quoteToken.decimals)).toFixed(5)} {position.isCall ? vault.baseToken.name : vault.quoteToken.name}</td>
    <td>${(data.pnl / 1e8).toFixed(4)}</td>
  </tr>)
}

export default HistoryTx;