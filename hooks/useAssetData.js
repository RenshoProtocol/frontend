import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useAddresses from "./useAddresses";
import useTokenBalance from "./useTokenBalance";
import useTokenContract from "./useTokenContract";
import useOraclePrice from "./useOraclePrice";
import { ethers } from "ethers";

/// Get an array with all data related to a symbol, eg USDC or ETH, including user balances and pool balance
/// @param address if a string, use that asset, if object, iterates over as a list of addresses
export default function useAssetData(address, vaultAddress) {
  const { account } = useWeb3React();
  const [totalSupply, setTotalSupply] = useState();
  const [roeTotalSupply, setRoeTotalSupply] = useState(0);
  const [debt, setDebt] = useState(0);
  const [price, setPrice] = useState(0);
  const [variableRate, setVariableRate] = useState(0);
  const [supplyRate, setSupplyRate] = useState(0);
  const [deposited, setDeposited] = useState(0);
  
  
  const ADDRESSES = useAddresses(vaultAddress);
  let lp = ADDRESSES["lendingPools"][0] || {};

  // if vault Address not defined, happens sometimes like with tx history
  if (ADDRESSES["lendingPools"].length > 1){
    for (let k of ADDRESSES["lendingPools"]){
      if(k.baseToken.address == address) {
        lp = k; break;
      }
    }
    
  }
  var asset = {
    address: address,
    icon: "/favicon.ico",
  };

  // will fail with Error: Rendered more hooks than during the previous render. if the asset address isnt found here, since it would skip some hooks
  if (lp.address) {
    if (address == lp["baseToken"].address)
      asset = { type: "single", ...lp.baseToken};
    else if (address == lp["quoteToken"].address)
      asset = { type: "single", ...lp.quoteToken };
  }
  if (asset.name && asset.type != "ticker" && asset.type != "geVault")
    asset.icon = "/icons/" + asset.name.toLowerCase() + ".svg";

  const assetContract = useTokenContract(address);
  const roeToken = useTokenContract(asset.roeAddress);
  
  asset = {
    supplyApr: supplyRate,
    feeApr: 0,
    debtApr: parseFloat(variableRate || 0),
    totalApr: parseFloat(supplyRate),
    wallet: 0,
    deposited: 0,
    debt: debt,
    tvl: totalSupply * price,
    totalSupply: totalSupply,
    roeTotalSupply: roeTotalSupply,
    oraclePrice: price,
    deposited: deposited,
    contract: assetContract,
    roeContract: roeToken,
    ...asset,
  };

  const oracle = useOraclePrice(lp);
  const getPrice = async () => {
    if (!oracle || !address) return;
    try {
      var data = await oracle.getAssetPrice(address);
      setPrice(ethers.utils.formatUnits(data, 8));
    } catch (e) {
      //console.log('get oracle asset price', e, oracle, address);
    }
  };
  getPrice();

  const getAssetData = async () => {
    try {
      if (!assetContract || !asset.roeAddress) return;
      var data = await assetContract.balanceOf(asset.roeAddress);
      setTotalSupply(ethers.utils.formatUnits(data, asset.decimals));
    } catch (e) {
      //console.log('get asset data error', e)
    }
  };
  getAssetData();

  {
    const { data } = useTokenBalance(account, asset.address);
    asset.wallet = ethers.utils.formatUnits(data ?? 0, asset.decimals) ?? 0;
  }
  asset.depositedValue = (asset.deposited / asset.totalSupply) * asset.tvl;

  return asset;
}
