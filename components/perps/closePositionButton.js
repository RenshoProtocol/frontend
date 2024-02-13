import { useState } from "react";
import { Button, Spin, Popover } from "antd";
import { WarningOutlined} from "@ant-design/icons";
import GEPM_ABI from "../../contracts/GoodEntryPositionManager.json";
import useContract from "../../hooks/useContract";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { useTxNotification } from "../../hooks/useTxNotification";

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const ClosePositionButton = ({ vault, position, setRefresh, warning }) => {
  const { account } = useWeb3React();
  const [isSpinning, setSpinning] = useState(false);
  const [showSuccessNotification, showErrorNotification, contextHolder] =
    useTxNotification();
  const opmContract = useContract(vault.positionManagerV2, GEPM_ABI);

  const closePosition = async () => {
    setSpinning(true);
    try {
      const { hash } = await opmContract.closePosition(position.positionId);
      showSuccessNotification(
        "Position closed",
        "Position closed successful",
        hash
      );
      await sleep(2000)
      console.log('gotta resf')
      setRefresh(new Date().getTime())
    } catch (e) {
      console.log("Error closing position", e);
      showErrorNotification(e.code, e.reason);
    }
    setSpinning(false);
  };

  return (
    <>
      {contextHolder}
      {isSpinning ? (
        <Spin />
      ) : (
        <>
          <Button size="small" onClick={closePosition}>
            Close
          { 
            warning > 0 ?
              <Popover
                placement="top"
                title="Early Close"
                style={{ border: "1px solid blue"}}
                content={
                  <div style={{ width: 250 }}>The minimum fee perceived is 1h30 of funding. <br/>Your total funding fees {warning / 1e6} USDC</div>
                }
              >
                <WarningOutlined style={{ color: "#e57673"}}  />
              </Popover>
              : <></>
          }
          </Button>
        </>
      )}
    </>
  );
};

export default ClosePositionButton;
