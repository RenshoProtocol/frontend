import { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import useContract from "./useContract";
import useAddresses from "./useAddresses";
import REFERRALS_ABI from "../contracts/Referrals.json";
import { ethers } from "ethers";
import axios from "axios";


export default function useReferrals(refresh) {
  const ADDRESSES = useAddresses();
  const refAddress = ADDRESSES["referrals"]
  const refContract = useContract(refAddress, REFERRALS_ABI);
  const { account } = useWeb3React();
  const [fees, setFees] = useState([]);
  const [refDetails, setRefDetails] = useState(0)

  const referralsDetails = {
    code: "",
    fees: fees,
    ...refDetails,
    contract: refContract
  }
  
  /// event ReferralFee(address indexed user, address token, uint amount);
  const FEES_EVENT = "0x458d770e0a68c707856bbe7bd1ade458af2e0c26c92857d11879a006bc48adef"
  const FEES_EVENT_TYPES = ["address", "uint256"]


  useEffect(() => {
    const getPastFees = async () => {
      try {
        const refDetails_ = await refContract.getReferralParameters(account)
        const referrerDetails = await refContract.getReferralParameters(refDetails_._referrer)
        setRefDetails({...refDetails_, referrerName: referrerDetails.name})
        
        // Get recent fees
        const url = "https://api.arbiscan.io/api?module=logs&action=getLogs&topic0="+FEES_EVENT+"&topic0_1_opr=and&apiKey=BYUIRGM2YBGEM36ZSC7PWW7DTAP8FY2KIW&topic1=0x000000000000000000000000"+account.substring(2,42)
        var dataraw = (await axios.get(url)).data.result;
        var feeEvents = []
        for (let ev of dataraw){
          const data = ethers.utils.defaultAbiCoder.decode(FEES_EVENT_TYPES, ev.data);
          feeEvents.push({token: data[0], amount: data[1].toString(), ...ev})
        }
        setFees(feeEvents)
      }
      catch(e) {console.log("Error fetching referrals", e)}
    };


    if (refAddress && account) getPastFees();
  }, [refAddress, account, refresh]);

  return referralsDetails;
}
