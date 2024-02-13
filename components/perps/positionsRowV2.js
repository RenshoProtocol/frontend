import useAssetData from "../../hooks/useAssetData";
import ClosePositionButton from "./closePositionButton";
import useAddresses from "../../hooks/useAddresses";
import PnlPopup from  "./pnlPopup.js";
import { CaretUpOutlined, CaretDownOutlined, ExportOutlined } from "@ant-design/icons";
import { ethers } from "ethers";


const PositionsRowV2 = ({ position, vault, price, setRefresh }) => {
  /*
    struct Position {
      bool isCall;
      /// @notice option type: 0: regular, 1: streaming
      OptionType optionType;
      uint strike;
      uint notionalAmount;
      uint collateralAmount;
      uint startDate;
      /// @dev if streaming option, this will be fundingRate, if fixed option: endDate
      // Funding rate in quoteToken per second X10
      uint data;
    }
    added positionId in hook
  */

  let direction = position.isCall ? "LONG" : "SHORT"
  let strike = parseFloat(ethers.utils.formatUnits(position.strike, 8))
  // pnl = assets value - debt value , debt value = debt amount / total Supply * underlying value
  let pnl = 0;

  if (position.isCall && price > strike){
    pnl += position.notionalAmount * (price - strike) / 10**(vault.baseToken.decimals)
  } else if (!position.isCall && price < strike){
    pnl += (position.notionalAmount / strike ) * (strike - price) / 10**(vault.quoteToken.decimals)
  }
  // sub spent premium
  pnl -= position.feesAccumulated / 10**(vault.quoteToken.decimals)

  let pnlPercent = pnl / (position.collateralAmount - 4e6) * 1e8;
  let notionalUsd = position.isCall ? 
    ethers.utils.formatUnits(position.notionalAmount.mul(position.strike).div(1e8), vault.baseToken.decimals)
    : ethers.utils.formatUnits(position.notionalAmount, vault.quoteToken.decimals);

  // divide by 1e10 for scaling and 1e6 for usdc decimals * 100 for percent
  let fundingRate = parseFloat(position.data.mul(3600).toString()) / notionalUsd / 1e14
  let initialCollateral = position.collateralAmount - 4e6;
  let collateralAmount = initialCollateral - position.feesAccumulated; // - FIXED_EXERCISE_FEE
  let runwayInSeconds = collateralAmount * 1e10 / position.data; // data is fundingRateX10
  let runwayHours = Math.floor(runwayInSeconds / 3600)
  let runwayMinutes = Math.floor((runwayInSeconds % 3600) / 60);

  const tdStyle = { paddingTop: 4, paddingBottom: 4 };

  return (
    <tr key={position.startDate}>
      <td style={{...tdStyle, paddingLeft: 0, fontWeight: 'bold'}}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={"/icons/"+vault.baseToken.name.toLowerCase()+".svg"}
            alt={vault.baseToken.name}
            height={20}
            style={{ marginRight: 8 }}
          />
          {vault.baseToken.name}
        </div>
      </td>
      <td style={tdStyle}>
        <span
          style={{
            color: position.isCall ? "#55d17c" : "#e57673",
            fontWeight: "bold",
            fontSize: "smaller",
          }}
        >
          {direction}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{fontWeight: 500 }}>${parseFloat(initialCollateral / 1e6).toFixed(2)}</span>
      </td>
      <td style={tdStyle}>
        <span style={{fontWeight: 500 }}>
          ${parseFloat(notionalUsd).toFixed(2)}{" "}
          ({Math.round(parseFloat(notionalUsd).toFixed(2)/parseFloat(initialCollateral / 1e6))}x)
        </span>
      </td>
      <td style={tdStyle}>
        {fundingRate.toFixed(4)}% (<span style={{ fontSize: "small"}}>{runwayHours} h {runwayMinutes} min</span>)
      </td>
      <td style={tdStyle}>${ethers.utils.formatUnits(position.strike, 8)}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center'}}>
          { price > 0 ? <>
              <div style={{ marginRight: 8}}>
                <span style={{ color: pnl >= 0 ? "#55d17c" : "#e57673" }}>
                  {pnl == 0 ? <></> : (pnl > 0 ? <CaretUpOutlined /> : <CaretDownOutlined />)}
                  {pnlPercent.toFixed(2)}%
                </span>
                <br />
                {" "}${(isNaN(pnl) ? 0 : pnl).toFixed(3)}
              </div>           
              <PnlPopup token0={vault.baseToken} direction={direction} pnl={pnl} pnlPercent={pnlPercent} strike={position.strike.toString()} price={price} >
                <ExportOutlined />
              </PnlPopup>
            </>
            :  <>-</>
          }

        </div>
      </td>
      <td style={tdStyle}>
        <ClosePositionButton position={position} vault={vault} setRefresh={setRefresh} warning={position.feesAccumulated < position.feesMin ? position.feesMin : 0} />
      </td>
    </tr>
  );
};

export default PositionsRowV2;
