import {useEffect, useState} from "react";
import { Card, Button, Input, Spin, Divider, Dropdown } from "antd";
import {DownloadOutlined, UploadOutlined, DownOutlined } from "@ant-design/icons"
import { useWeb3React } from "@web3-react/core";
import useAssetData from "../../hooks/useAssetData";
import useTokenContract from "../../hooks/useTokenContract";
import { useTxNotification } from "../../hooks/useTxNotification";
import useETHBalance from "../../hooks/useETHBalance";
import { ethers } from "ethers";
import StakingBox from "./stakingBox";


const GeVaultForm = ({vault, vaultDetails}) => {
  const { account, chainId } = useWeb3React();
  const [direction, setDirection] = useState("Deposit");
  const [token, setToken] = useState(vault.baseToken.name)
  const [inputValue, setInputValue] = useState()
  const [isSpinning, setSpinning] = useState(false);
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();

  useEffect(() => {
    setToken(vault.baseToken.name);
  }, [vault.address]);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  
  const ethBalance = useETHBalance(account).data / 1e18;
  const assetData = useAssetData(token == vault.baseToken.name ? vault.baseToken.address : vault.quoteToken.address, vault.address);
  const tokenContract = useTokenContract(assetData.address);
  const myShare = (100*parseFloat(vaultDetails.walletValue)/parseFloat(vaultDetails.tvl)).toFixed(2)

  // if deposit baseToken or withdraw baseToken, fee is fee0
  var operationFee = vaultDetails.fee1;
  if ( (direction == "Deposit" && token == vault.baseToken.name) || (direction == "Withdraw" && token == vault.quoteToken.name) ) operationFee = vaultDetails.fee0;
  var balance = vaultDetails.wallet;
  if (direction == "Deposit") {
    if( token == "ETH" ) balance = ethBalance
    else balance = assetData.wallet
  }

  const isButtonDisabled = !inputValue || parseFloat(inputValue) > balance || (vaultDetails.status == "Withdraw Only" && direction == "Deposit") || chainId != 168587773
    
  const deposit = async () => {
    setSpinning(true);
    try {
      if (chainId != 168587773) throw new Error("Invalid Chain")
      let result;
      if (token == "ETH"){
        result = await vaultDetails.contract.deposit(assetData.address, 0, {value: ethers.utils.parseUnits(inputValue, 18)});
      }
      else {
        // check allowance
        result = await tokenContract.allowance(account, vaultDetails.address);
        if ( 
            result.lt(
              ethers.utils.parseUnits(inputValue, assetData.decimals)
            )
          ) {
            result = await tokenContract.approve(
              vaultDetails.address,
              ethers.constants.MaxUint256
            );
            await delay(8000);
          }
        result = await vaultDetails.contract.deposit(assetData.address, ethers.utils.parseUnits(inputValue, assetData.decimals), {gasLimit: 10000000});
      }
      showSuccessNotification(
        "Assets deposited",
        "Assets deposited successful",
        result.hash
      );
    }
    catch(e){
      console.log("Error withdrawing", e.message);
      if (e.code == -32603 ) 
        showErrorNotification(
        'Deposit error', 
        <>Seems like Metamask experimental features using Opensea is turned on and is causing issues. You can try disabling that feature by going into Metamask: Settings &gt; Experimental.<br/><br/>Alternatively, you can use other wallets like OKX or Rabby.</>
      );
      else 
        showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  }
  
  
  const withdraw = async () => {
    setSpinning(true);
    try {
      let result = await vaultDetails.contract.withdraw(ethers.utils.parseUnits(inputValue, 18), assetData.address);
      showSuccessNotification(
        "Assets withdrawn",
        "Assets withdrawn successful",
        result.hash
      );
    }
    catch(e){
      console.log("Error withdrawing", e.message);
      showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  }
  
  const items = [
    {
      key: '1',
      label: vault.baseToken.name,
      onClick: (e) => {setToken(vault.baseToken.name)}
    },
    {
      key: '2',
      label: vault.quoteToken.name,
      onClick: (e) => {setToken(vault.quoteToken.name)}
    }
  ]
  

  return(<>
  
  <Card style={{marginLeft: 64, color: 'white'}}>
    {contextHolder}
    <div style={{marginBottom: 24}}>
      <Button
        type={direction == "Deposit" ? "primary" : "default"}
        style={{ width: "50%", textAlign: "center", borderRadius: "4px 0 0 4px" }}
        onClick={() => {
          setDirection("Deposit");
        }}
      >
        <strong><DownloadOutlined /> Deposit</strong>
      </Button>
      <Button
        type={direction == "Withdraw" ? "primary" : "default"}
        style={{ width: "50%", textAlign: "center", borderRadius: "0 4px 4px 0" }}
        onClick={() => {
          setDirection("Withdraw");
        }}
      >
        <strong><UploadOutlined /> Withdraw</strong>
      </Button>      
    </div>
    
    <span>Asset</span>
    <Dropdown menu={{items, selectable: true, defaultSelectedKeys: ['1'],}}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: "#1D2329", borderRadius: 4, padding: 8 }}>
        <span>{token}</span>
        <DownOutlined />
      </div>
    </Dropdown>
    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>Amount</span>
      <span>Wallet: {parseFloat(balance).toFixed(3)} {direction == "Deposit" ? <>{token}</> : <>{vaultDetails.name}</>}</span>
    </div>
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Input
        placeholder="Amount"
        suffix=<a href="#" onClick={()=>{setInputValue(balance)}}>Max</a>
        bordered={false}
        onChange={(e) => setInputValue(e.target.value)}
        key="inputamount"
        value={inputValue}
        style={{ backgroundColor: "#1D2329", padding: 8, color: 'white' }}
      />
    </div>
    <div style={{ marginTop: 24, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{direction} Fee</span>
      <span>{parseFloat(operationFee).toFixed(2)}%</span>
    </div>
    {isSpinning ? (
      <Button type="default" style={{ width: "100%" }}>
        <Spin />
      </Button>
    ) : (
      <Button
        type="default"
        onClick={()=>{direction == "Deposit" ? deposit() : withdraw()}}
        disabled={isButtonDisabled}
         style={{ width: "100%" }}
      >
        {direction+" "+token}
      </Button>
    )}
    <Divider />
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>My Liquidity</span>
      <span>{parseFloat(vaultDetails.wallet).toFixed(2)} GEV (${parseFloat(vaultDetails.walletValue).toFixed(0)})</span>
    </div>
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>My Share</span>
      <span>{myShare}%</span>
    </div>
  </Card>
  
  <StakingBox vault={vault} vaultDetails={vaultDetails} />
  </>);
};

export default GeVaultForm;
