import { useState, useEffect } from "react";
import ADDRESSES from "../constants/RoeAddresses.json";
import { useWeb3React } from "@web3-react/core";
import VAULTV2_ABI from "../contracts/GoodEntryVault.json";
import ERC20_ABI from "../contracts/ERC20.json";
import useContract from "./useContract";
import { ethers } from "ethers";
import axios from "axios";

var statsPeriod = "7d";

export default function useVaultV2(vault) {
  if (!vault) vault = {name: ""}

  const [stats, setStats] = useState({baseAmount: 0, quoteAmount: 0, tvl: 0, history: []});
  const [maxTvl, setMaxTvl] = useState(0);
  const [fee0, setFee0] = useState(0);
  const [fee1, setFee1] = useState(0);
  const [feeApr, setApr] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [userValue, setUserValue] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const { account } = useWeb3React();
  const address = vault.address;
  
  const vaultV2ContractWithSigner = useContract(address, VAULTV2_ABI);

  var data = {
    address: address,
    name: vault.name,
    tvl: stats.tvl / 1e8,
    maxTvl: maxTvl,
    totalSupply: totalSupply,
    fee0: fee0,
    fee1: fee1,
    feeApr: feeApr,
    history: stats.history,
    wallet: userBalance,
    walletValue: userValue,
    contract: vaultV2ContractWithSigner,
    reserves: stats,
    icon: "/icons/" + vault.name.toLowerCase() + ".svg",
  }
  
  useEffect( () => {
    const getData = async () => {
      const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
      const vaultV2Contract = new ethers.Contract(address, VAULTV2_ABI, customProvider);

      
      try {
        const statsUrl = "https://api.goodentry.io/arbitrum/vaultStats/"+address+".json"
        var statsVault = (await axios.get(statsUrl)).data
        
        var totalSupply = parseInt(statsVault["totalSupply"])
        var tvl = parseInt(statsVault["tvl"])
        var tvlCap = parseInt(statsVault["tvlCap"])
        
        setTotalSupply(totalSupply);
        setStats(statsVault);
        setMaxTvl(tvlCap / 1e8);
        
        let aprPerceived = 0
        for (let k = 0; k < statsVault.history.length; k++){
          let thatDayFees = statsVault.history[k]
          aprPerceived += parseInt(thatDayFees["feesX8"]) / parseInt(thatDayFees["tvlX8"])
        }
        setApr(aprPerceived * 36500 / statsVault.history.length)

        
        let f0 = await vaultV2Contract.getAdjustedBaseFee(true);
        setFee0(f0/100);
        let f1 = await vaultV2Contract.getAdjustedBaseFee(false);
        setFee1(f1/100);     
        
        if (account){
          try {
            let userBal = await vaultV2Contract.balanceOf(account)
            setUserBalance(ethers.utils.formatUnits(userBal, 18) || 0);
            setUserValue(totalSupply == 0 ? 0 : tvl * userBal / totalSupply / 1e8);
          }
          catch(e){
            console.log("useVaultV2", address, e)
          }
        }
      }
      catch(e){
        console.log("useVaultV2", address, e)
      }
    }
    
    if (address) getData()
  }, [address, account])

  return data;
}
