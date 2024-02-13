import { useState, useEffect } from "react";
import useContract from "./useContract";
import GEV_ABI from "../contracts/GoodEntryVault.json";
import useAddresses from "./useAddresses";
import { ethers } from "ethers";

export default function useOraclePrice(vault) {
  const [price, setPrice] = useState(0);
  //const vaultContract = useContract(vault.address, GEV_ABI);

  const customProvider = new ethers.providers.JsonRpcProvider("https://sepolia.blast.io");
  const vaultContract = new ethers.Contract(vault.address, GEV_ABI, customProvider);

  useEffect(() => {
    const getPrice = async () => {
      try {
        console.log('vaultCX', vaultContract.address)
        const basePrice = await vaultContract.getBasePrice();
        setPrice(basePrice / 1e8);
      }
      catch(e) {console.log("Error fetching baseprice", e)}
    };

    if (vault.address && vaultContract) getPrice();
    const intervalId = setInterval(() => {
      if (vault.address && vaultContract) getPrice();
    }, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, [vault.address, vaultContract]);

  return price;
}
