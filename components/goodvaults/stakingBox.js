import { ethers } from "ethers";
import {useEffect, useState} from "react";
import { Card, Button, Input, Spin, Divider, Dropdown } from "antd";
import {DownloadOutlined, UploadOutlined, DownOutlined } from "@ant-design/icons"
import { useWeb3React } from "@web3-react/core";
import RewardTracker_ABI from "../../contracts/RewardTracker.json";
import RewardStreamer_ABI from "../../contracts/RewardStreamer.json";
import useContract from "../../hooks/useContract";
import { useTxNotification } from "../../hooks/useTxNotification";


const StakingBox = ({vault, vaultDetails}) => {
  const { account } = useWeb3React();
  const [refresh, setRefresh] = useState(0)
  const [stakedBal, setStakedBal] = useState(0)
  const [rewardRate, setRewardRate] = useState(400)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [direction, setDirection] = useState("Stake");
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const tracker  = useContract(vault.rewardTracker, RewardTracker_ABI);
  const streamer = useContract(vault.rewardStreamer, RewardStreamer_ABI);
    
    
    
  useEffect(() => {
    const getBalances = async () => {
      try {
        const stakedBal_ = await tracker.balanceOf(account)
        const pending_ = await tracker.callStatic.claim()
        setStakedBal(stakedBal_)
        setPendingRewards((pending_.toString() / 1e18).toFixed(3))
      } catch(e) { console.log("Get staking bals", e)}
      
    }
    if(vault.rewardTracker && account) getBalances()
  }, [vault.rewardTracker, account, refresh])



  const stake = async () => {
    try {
      const walletBalance = ethers.utils.parseUnits(vaultDetails.wallet, 18); // vaultDetails.wallet
      let result = await vaultDetails.contract.allowance(account, tracker.address);
      if ( result.lt(walletBalance)) {
          result = await vaultDetails.contract.approve(tracker.address, ethers.constants.MaxUint256);
          await delay(5000);
        }

      result = await tracker["stake(uint256)"](walletBalance);
      showSuccessNotification("Assets staked", "Assets staked successful", result.hash);
      await delay(2000);
      setRefresh(refresh+1)
    }
    catch(e){
      console.log("Error staking", e.message);
      showErrorNotification(e.code, e.reason);
    }
  }



  const unstake = async () => {
    try {
      let result = await tracker["unstake(uint256)"](stakedBal);
      showSuccessNotification("Unstaked", "Unstaked successful", result.hash);
      await delay(2000);
      setRefresh(refresh+1)
    }
    catch(e){
      console.log("Error staking", e.message);
      showErrorNotification(e.code, e.reason);
    }
  }



  const claim = async () => {
    try {
      let result = await tracker.claim();
      showSuccessNotification("Claimed", "Claimed successfully", result.hash);
      await delay(2000);
      setRefresh(refresh+1)
    }
    catch(e){
      console.log("Error staking", e.message);
      showErrorNotification(e.code, e.reason);
    }
  }
  
  
  



  if (vault.name == "ARB-USDC") return (
    <Card style={{marginLeft: 64, marginTop: 16}} title="Farming Rewards">
      The ARB-USDC vault receive rewards daily that are directly deposited in the vault.
      <br/>
      <br/>
      Total ARB rewards
      <span style={{ float: 'right'}}>
        <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex'}}>
          <img src={"/icons/arb.svg"} height={18} style={{marginRight: 8}} />{rewardRate}/day
        </div>
      </span>
    </Card>)
  if (!vault.rewardTracker) return (<></>)

  return (
  <Card style={{marginLeft: 64, color: 'white', marginTop: 16}} title="Farming Rewards">
    ARB rewards
    <span style={{ float: 'right'}}>
      <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex'}}>
        <img src={"/icons/arb.svg"} height={18} style={{marginRight: 8}} />{rewardRate}/day
      </div>
    </span>
    <br/>
    Unstaked Balance: <span style={{float: 'right'}}>{vaultDetails.wallet > 0 ? parseFloat(vaultDetails.wallet).toFixed(2) : 0}</span>
    <br/>
    Staked Balance: <span style={{float: 'right'}}>{stakedBal > 0 ? (stakedBal.toString() / 1e18).toFixed(2) : 0}</span>
    <br/>
    <div style={{marginBottom: 0, marginTop: 24}}>
      <Button
        type={direction == "Stake" ? "primary" : "default"}
        style={{ width: "47%", textAlign: "center", borderRadius: 4 }}
        onClick={stake}
        disabled={vaultDetails.wallet == 0}
      >
        <strong><DownloadOutlined /> Stake All</strong>
      </Button>
      <Button
        type={direction == "Unstake" ? "primary" : "default"}
        style={{ width: "47%", textAlign: "center", borderRadius: 4, float: 'right' }}
        onClick={unstake}
      >
        <strong><UploadOutlined /> Unstake All</strong>
      </Button>      
    </div>
    
    <Divider />
    Pending Rewards
    <span style={{ float: 'right'}}>
      <div style={{ flexDirection: 'row', alignItems: 'center', display: 'flex'}}>
        {pendingRewards}
        <img src={"/icons/arb.svg"} height={18} style={{marginLeft: 8}} />
      </div>
    </span>
    <br/>
    <Button
      type="primary"
      style={{ width: "47%", textAlign: "center", borderRadius: 4, marginTop: 8, float: 'right' }}
      onClick={claim}
    >
      <strong><UploadOutlined /> Claim</strong>
    </Button>  
  </Card>)
}


export default StakingBox;