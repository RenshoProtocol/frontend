import React, { useState } from "react"
import { Card, Tooltip, Spin, Checkbox, Tabs } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { useWeb3React } from "@web3-react/core";
import PositionsRowV2 from "./positionsRowV2";
import usePositionsHistory from "../../hooks/usePositionsHistory";
import useOraclePrice from "../../hooks/useOraclePrice";
import usePositionsV2 from "../../hooks/usePositionsV2";

// show all positions for a given vault
const Positions = ({ vault, refresh, setRefresh }) => {
  const { account} = useWeb3React();
 
  //const history = usePositionsHistory(account, refresh);
  let positions = usePositionsV2(account, vault.positionManagerV2, refresh)

  let price = useOraclePrice(vault);
  
  return (<>
    {
      positions.map((position)=>{
        return <PositionsRowV2 key={vault.address} position={position} vault={vault} price={price} setRefresh={setRefresh} />
      })
    }
    </>)
};

export default Positions;
