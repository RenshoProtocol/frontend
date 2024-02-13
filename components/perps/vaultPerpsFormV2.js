import { useState, useEffect } from "react";
import { Button, Input, Spin, Slider, Card, Modal, Popover } from "antd";
import { RiseOutlined, FallOutlined, QuestionCircleOutlined} from "@ant-design/icons";

import GEPM_ABI from "../../contracts/GoodEntryPositionManager.json";
import ERC20_ABI from "../../contracts/ERC20.json";
import StrikeManager_ABI from "../../contracts/StrikeManager.json";
import useContract from "../../hooks/useContract";
import { ethers } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useTxNotification } from "../../hooks/useTxNotification";
import PayoutChart from "./payoutChart";


const VaultPerpsFormV2 = ({ vault, price, strikeManagerAddress, refresh, oiInfo }) => {
  // Note: all addresses.json will be revamped, esp. can replcae token0/token1 by baseToken/quoteToken so easier to quesry and display
  const { account, library } = useWeb3React();
  const [isSpinning, setSpinning] = useState()
  const [quoteBalance, setQuoteBalance] = useState(0)
  const [strikeX8, setStrike] = useState(ethers.constants.Zero.add(1));
  const [direction, setDirection] = useState("Long");
  let isCall = direction == "Long";
  
  const [fundingRate, setFundingRate] = useState(0);
  // can request minPositionValueX8 from contract but it's fixed at $50 and wont likely change
  const [minPositionValue, setMinPositionValue] = useState(50);
  const minCollateralAmount = 1; // fixed in contract, min collateral $1
  const [collateralAmount, setCollateralAmount] = useState(1);
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
    
  
  const customProvider = new ethers.providers.JsonRpcProvider("https://sepolia.blast.io");
  const pmContract = useContract(vault.positionManagerV2, GEPM_ABI);
  const quoteContract = useContract(vault.quoteToken.address, ERC20_ABI)
  const strikeContract = new ethers.Contract(strikeManagerAddress, StrikeManager_ABI, customProvider);
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  
  const [leverage, setLeverage] = useState(420)
  const [sliderLevel, setSliderLevel] = useState(3)
  const leverageGrid = [100, 200, 420, 690, 1001, 1500, 2000, 2500, 3000, 3500, 4200, 5000, 6969];
  
  const positionSize = collateralAmount * leverage;
  
  let maxSize = direction == "Long" ?
    (oiInfo.callMax - oiInfo.callOI) * price / 10**(vault.baseToken.decimals)
    : (oiInfo.putMax - oiInfo.putOI) / 10**vault.quoteToken.decimals
  if (maxSize < 0) maxSize = 0

  
  // if leverage is set with the slider, chanbge the multiplier according to slider grid
  const setLeverageSlider = (lev) => {
    setLeverage(leverageGrid[lev-1])
    setSliderLevel(lev)
  }

  // Get user's USDC balance
  useEffect(() => {
    const getData = async () => {
      let quoteBal = await quoteContract.balanceOf(account);
      setQuoteBalance(ethers.utils.formatUnits(quoteBal, vault.quoteToken.decimals)); 
    }
    if (account && quoteContract) getData();
  }, [account, quoteContract])


  // Get closest strike based on current pair price
  useEffect(() => {
    const getData = async () => {
      let valStrike = 
        direction == "Long" ? 
          await strikeContract.getStrikeStrictlyAbove(await strikeContract.getStrikeAbove(parseInt(price * 1e8)))
          : await strikeContract.getStrikeStrictlyBelow(await strikeContract.getStrikeBelow(parseInt(price * 1e8)))
      setStrike(valStrike);
    }  
    if (price > 0 && strikeContract) getData();
  }, [price, strikeContract, direction])
  
  
  // Compute funding rate based on current input parameters
  useEffect(() => {
    const getData = async () => {
      try {
        // position size in quote tokens on UX, but the contract needs size in base token for longs, and quote tokens for shorts
        let notionalAmount = 
          isCall ? 
            ethers.utils.parseUnits((positionSize / price).toFixed(vault.baseToken.decimals), vault.baseToken.decimals) 
            : ethers.utils.parseUnits( parseFloat(positionSize).toString(), vault.quoteToken.decimals);
        // the price is per unit, not for the whole notionalAmount. used to estimate utilizationRate accurately (higher utilization rate will push option price up)

        // function getOptionPrice(bool isCall, uint strike, uint size, uint timeToExpirySec) public view returns (uint optionPriceX8);
        const optionPriceX8 = await pmContract.getOptionPrice(
          isCall, 
          strikeX8.toString(), 
          notionalAmount,
          14400 // 4h, time for streaming options
        );
        //console.log('option price ', optionPriceX8.toString(), price)
        // optionPriceX8 is the price of 1 call or 1 put on the base, for 6h, so hourly funding in % is 100 * price / 6h
        let fRate = 100 * 2 * optionPriceX8 / 4 / 1e8 / price;
        setFundingRate(fRate);
      } catch(e) {
        console.log('getOptionPrice', e);
      }
    }
    if (price > 0) getData()
  }, [positionSize, price,  isCall, vault.positionManagerV2, strikeX8.toString(), vault.baseToken.decimals, vault.quoteToken.decimals, leverage])


  // Open position
  const openPosition = async () => {
    setSpinning(true)
    try {
      // position size in quote tokens on UX, but the contract needs size in base token for longs, and quote tokens for shorts
      let notionalAmount = 
        isCall ? 
          ethers.utils.parseUnits((positionSize / price).toFixed(vault.baseToken.decimals), vault.baseToken.decimals) 
          : ethers.utils.parseUnits(positionSize.toString(), vault.quoteToken.decimals);

      let collateralAmountAdj = ethers.utils.parseUnits(parseFloat(collateralAmount).toString(), vault.quoteToken.decimals);
      // check allowance // dirty add the 4e6 fixed exercise fee
      let result = await quoteContract.allowance(account, vault.positionManagerV2);
      if ( result.lt(collateralAmountAdj + 4e6)) {
        result = await quoteContract.approve(vault.positionManagerV2, ethers.constants.MaxUint256);
        await delay(6000);
      }
      
      // function openStreamingPosition(bool isCall, uint notionalAmount, uint collateralAmount) external returns (uint tokenId)
      const { hash } = await pmContract.openStreamingPosition(isCall, notionalAmount, collateralAmountAdj);
      await delay(4000)
      refresh(new Date().getTime())
      showSuccessNotification(
        "Position opened",
        "Position opened successful",
        hash
      );
    } catch (e) {
      console.log(e);
      showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  };


  let collateralBelowBalance = parseFloat(quoteBalance) < parseFloat(collateralAmount) + 4;
  let positionBelowMin = minPositionValue > positionSize
  let collateralBelowMin = minCollateralAmount > collateralAmount
  let maxOIreached = positionSize > maxSize
  const isOpenPositionButtonDisabled = parseFloat(positionSize) == 0 || positionBelowMin || collateralBelowMin || collateralBelowBalance || maxOIreached;

  let openPositionButtonErrorTitle = "Open " + direction;
  if (parseFloat(collateralAmount) > 0 && parseFloat(positionSize) > 0){
    if (positionBelowMin) openPositionButtonErrorTitle = "Position size too Low";
    else if (collateralBelowMin) openPositionButtonErrorTitle = "Collateral amount too Low";
    else if (collateralBelowBalance) openPositionButtonErrorTitle = "Not enough funds";
    else if (maxOIreached) openPositionButtonErrorTitle = "Max OI Reached";
  }
  
  // runway: hourly funding funding * size = hourly cost, runway in hours = collateral amount / hourly cost
  let hourlyCost = fundingRate * positionSize / 100
  let runway = hourlyCost == 0 ? 0 : parseFloat(collateralAmount) / hourlyCost
  let runwayHours = Math.floor(runway)
  let runwayMinutes = Math.floor((runway - runwayHours) * 60);
  
  let step = 10**Math.ceil(Math.log10(strikeX8 / 1e8) - 3)

  return (
  <>
    <Card style={{ marginBottom: 8, color: 'white' }}>
      <div>
        {contextHolder}
        <Button
          type={direction == "Long" ? "primary" : "default"}
          style={{ width: "50%", textAlign: "center", borderRadius: "4px 0 0 4px" }}
          icon={<RiseOutlined style={{marginRight: 8}}/>}
          onClick={() => {
            setDirection("Long");
          }}
        >
          <strong>Long</strong>
        </Button>
        <Button
          type={direction == "Short" ? "primary" : "default"}
          style={{ width: "50%", textAlign: "center", borderRadius: "0 4px 4px 0" }}
          icon={<FallOutlined style={{marginRight: 8}} />}
          onClick={() => {
            setDirection("Short");
          }}
          danger={direction == "Short"}
        >
          <strong>Short</strong>
        </Button>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 24,
          }}
        >
          <div>
            Activation Price
            <span style={{ float: "right" }}>
              Funding / 1h{" "}
              <Popover
                placement="top"
                title="Estimated Hourly Funding"
                style={{ border: "1px solid blue"}}
                content={
                  <div style={{ width: 250 }}>Funding is the borrowing interest rate.</div>
                }
              >
                <QuestionCircleOutlined />
              </Popover>
            </span>
          </div>
          <div style={{borderRadius: 4, backgroundColor: "#1D2329", padding: 8, marginBottom: 4 }}>
            {(strikeX8/1e8).toString()}
            <span style={{ float: "right"}}>{fundingRate.toFixed(4)}</span>
          </div>

          <span style={{ fontWeight: "bold", }}>Wager</span>
          <Input
            placeholder="Amount"
            suffix="USDC"
            onChange={(e) => setCollateralAmount(e.target.value)}
            key="inputamount"
            value={collateralAmount}
          />
          <div>
            <span style={{ fontWeight: "bold", }}>Payout Multiplier</span><br/>
          { leverage >= 4000 ? <img src="/images/sweatpepe.png"  style={{ float: 'right', height: 64, width: 64}} /> : <></>}
            <div  style={{display: 'flex', flexDirection: 'row', gap: 36}}>
              {/*Leverage: {parseFloat(collateralAmount) > 0 ? (positionSize / collateralAmount).toFixed(0)+"x" : <>&infin;</>}{" "}*/}
              <Input 
                style={{marginTop: 8, width: 96}} 
                value={leverage} suffix="X" 
                onBlur={() => { if (leverage < 100) setLeverage(100) }}
                onChange={(e) => {setLeverage(e.target.value)}}
              />
              
              <div style={{ fontSize: 'smaller'}}>
                <span style={{color: 'grey'}}>Runway</span>
                <Popover
                  placement="top"
                  title="Leverage"
                  style={{ border: "1px solid blue"}}
                  content={
                    <div style={{ width: 250 }}>On Rensho no liquidation by price! <br/>No scam wicks, no Stop-Loss hunts ;)
                    </div>
                  }
                >
                  <QuestionCircleOutlined />
                </Popover>
                <br/>
                <span style={{ fontSize: "small"}}>{runwayHours} h {runwayMinutes} min</span>
              </div>
            </div>
            
            {/*<Input
              style={{marginTop: 8}}
              placeholder="Amount"
              suffix="USDC"
              onChange={(e) => setLeverage(e.target.value)}
              key="collateralAmount"
              value={collateralAmount}
            />*/}
            <Slider
              min={1}
              max={13}
              onChange={(val)=> setLeverageSlider(val)}
              tooltip={{ open: false}}
              value={sliderLevel}
            />
          </div>
        </div>
      </div>
    </Card>
    <Card style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Market</span>
        <span style={{fontSize: "small"}}>{vault.name}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Side</span>
        <span style={{ fontSize: "small" }}>{direction}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Size</span>
        <span style={{ fontSize: "small", color: maxOIreached ? "#dc4446" : "rgba(138, 144, 152, 0.85)", fontWeight: maxOIreached ? 700 : 400}}>
          $ {positionSize} (max: ${maxSize.toFixed(0)})
        </span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Activation Price</span>
        <span style={{ fontSize: "small"}}>$ {(strikeX8/1e8).toString()}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Collateral (funding + reserved fee)</span>
        <span style={{ fontSize: "small"}}>$ {parseFloat(collateralAmount) + 4}</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Current Hourly Rate</span>
        <span style={{ fontSize: "small"}}>{fundingRate.toFixed(5)}%</span>
      </div>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between'}}>
        <span style={{color: "#94A3B8", fontSize: "small", fontWeight: 500 }}>Runway</span>
        <span style={{ fontSize: "small"}}>{runwayHours} h {runwayMinutes} min</span>
      </div>

      <Button
        type="primary"
        onClick={openPosition}
        disabled={isOpenPositionButtonDisabled}
        danger={direction == "Short"}
        style={{ width: "100%", marginTop: 8 }}
      >
        {isSpinning ? 
          <Spin /> 
          : isOpenPositionButtonDisabled ? openPositionButtonErrorTitle : "Open " + direction
        }
      </Button>
    </Card>
    <Card>
      <PayoutChart direction={direction} price={price} strike={strikeX8/1e8} step={step} />
    </Card>
  </>
  );
};

export default VaultPerpsFormV2;