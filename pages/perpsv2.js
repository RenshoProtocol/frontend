import { useEffect, useState } from "react";
import { Col, Row, Button, Card, Input, Typography, Spin, Tabs, Tooltip } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

import VaultPerpsFormV2 from "../components/perps/vaultPerpsFormV2";
import Positions from "../components/perps/positions";
import PositionsHistory from "../components/perps/positionsHistory"
import Infobar from "../components/perps/infobar";
import Chart from "../components/perps/chart";
import TradingViewWidget from "../components/perps/tv";
import useAddresses from "../hooks/useAddresses";
import useOraclePrice from "../hooks/useOraclePrice";
import { useWeb3React } from "@web3-react/core";
import GEPM_ABI from "../contracts/GoodEntryPositionManager.json";
import GEV_ABI from "../contracts/GoodEntryVault.json";
import {ethers} from 'ethers'

// Display all user assets and positions in all ROE LPs
const PerpsV2 = () => {
  const { account} = useWeb3React();
  
  const [oiInfo, setOiInfo] = useState({callOI: 0, putOI: 0, callMax: 1, putMax: 1})
  // only works for ARB in testing no other vault
  const [currentVault, selectVault] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const ADDRESSES = useAddresses();
  const gap = 12;
  let vaults = ADDRESSES["lendingPools"];
  const vault = vaults[currentVault]
  const thStyle = {
    color: "#94A3B8",
    fontWeight: 500,
    textDecorationStyle: "dotted",
    textDecorationStyle: 'dotted', 
    textDecorationColor: 'grey',
    textDecorationLine: 'underline'
  }
  
  const customProvider = new ethers.providers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
  const pmContract     = new ethers.Contract(vault.positionManagerV2, GEPM_ABI, customProvider);
  const vaultContract  = new ethers.Contract(vault.address, GEV_ABI, customProvider);
  
  useEffect(()=>{
    const getData = async() => {
      try {
        let info = await Promise.all([
          pmContract.openInterestCalls(),
          pmContract.openInterestPuts(),
          vaultContract.getReserves()
        ])

        let stat = {        
          callOI: parseInt(info[0].toString()),
          callMax: parseInt(info[2].baseAmount.toString()) * 60 / 100,
          putOI: parseInt(info[1].toString()),
          putMax: parseInt(info[2].quoteAmount.toString()) * 60 / 100,
        }

        setOiInfo(stat)
      }
      catch(e){console.log('get info stats', e)}
    }
    if(pmContract) getData()
  }, [pmContract.address])
  

  let price = useOraclePrice(vaults[currentVault]);

  return (
    <div style={{ minWidth: 1400, display: "flex", flexDirection: "row" }}>
      <div style={{ width: 1043 }}>
        <Card style={{ marginBottom: gap }} bodyStyle={{ padding: 8 }}>
          <Infobar
            vaults={vaults}
            current={currentVault}
            selectVault={selectVault}
            price={price}
            oiInfo={oiInfo}
          />
        </Card>
        <TradingViewWidget
          symbol={vaults[currentVault].tvSymbol}
        />
        <Card style={{ marginTop: 8 }}>
          <Tabs
            defaultActiveKey="Positions"

            items={[
              {
                label: "Positions",
                key: "Positions",
                children: <>
                    <table border={0}>
                      <thead>
                        <tr>
                          <th align="left" style={{...thStyle, paddingLeft: 0}}>Instrument</th>
                          <th align="left" style={thStyle}>Side</th>
                          <th align="left" style={thStyle}>Wager</th>
                          <th align="left" style={thStyle}>Size</th>
                          <th align="left" style={thStyle}>
                            Funding{" "}
                            <Tooltip placement="right" title="Hourly funding rate">
                              <QuestionCircleOutlined />
                            </Tooltip> (Runway)
                          </th>
                          <th align="left" style={thStyle}>Entry Price</th>
                          <th align="left" style={thStyle}>PNL&nbsp;&nbsp;</th>
                          <th align="left" style={{...thStyle, paddingRight: 0}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          vaults.map( vault => {
                            return (
                              <Positions key={vault.address} vault={vault} refresh={refreshCounter} setRefresh={setRefreshCounter} />
                            )
                          })
                        }
                      </tbody>
                    </table>
                  </>
                },
                {
                  label: "History",
                  key: "History",
                  children: <table border={0}>
                      <thead>
                        <tr>
                          <th align="left" style={{...thStyle, paddingLeft: 0}}>Date</th>
                          <th align="left" style={thStyle}>Tx</th>
                          <th align="left" style={thStyle}>Token</th>
                          <th align="left" style={thStyle}>Direction</th>
                          <th align="left" style={thStyle}>Strike</th>
                          <th align="left" style={thStyle}>Amount</th>
                          <th align="left" style={thStyle}>PNL&nbsp;&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                         <PositionsHistory account={account} refresh={refreshCounter} />
                      </tbody>
                    </table>
                },
              ]}
            />
        </Card>
      </div>
      <div style={{ width: 343, marginLeft: gap}}>
        <VaultPerpsFormV2
          vault={vaults[currentVault]}
          price={price}
          strikeManagerAddress={ADDRESSES["strikeManager"]}
          refresh={setRefreshCounter}
          oiInfo={oiInfo}
        />
      </div>
    </div>
  );
};

export default PerpsV2;