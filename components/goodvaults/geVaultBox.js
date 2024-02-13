import { useState } from "react";
import { Card, Col, Popover, Divider } from "antd";
import { QuestionCircleOutlined, WarningOutlined } from "@ant-design/icons";
import Slider from "../design/slider";
import { useRouter } from 'next/router';
import useVaultV2 from "../../hooks/useVaultV2";
import useAssetData from "../../hooks/useAssetData";

const GeVaultBox = ({vault}) => {
  const [highlightBox, setHighlightBox] = useState(false);
  const router = useRouter();
  const vaultDetails = useVaultV2(vault);
  //console.log('vaultDetails', vaultDetails)

  const toReadable = (value) => {
    if (value == 0) return 0;
    if (value < 10) return parseFloat(value).toFixed(2);
    if (value < 1000) return parseFloat(value).toFixed(0);
    if (value < 1e6) return (value / 1000).toFixed(0) + "k";
    if (value < 1e9) return (value / 1000).toFixed(0) + "M";
  };
  
  if (!vault || !vault.address ) return <></> 
  
  const filled = Math.round(100 * vaultDetails.tvl / vaultDetails.maxTvl);
  let totalApr = parseFloat(vaultDetails.feeApr)
  
  let incentiveApr = 0
  if(vault.rewardTracker || vaultDetails.name == "ARB-USDC") {
    incentiveApr = 100 * 365 * 2.15 * 400 / vaultDetails.tvl
  }
  
  const RewardsTag = () => {
    return (<div style={{backgroundColor: "#0A371B", color: "#FEF200", borderRadius: 4, padding: "4px 8px", display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: "smaller" }}>
      <img src="/logo.svg" height={18} alt='Good Entry Logo' style={{ marginRight:4 }} />
    </div>)
  }  
  
  return (
    <Col
      md={6}
      xs={24}
      style={{ marginBottom: 24, cursor: "pointer" }}
      onMouseOver={() => {
        setHighlightBox(true);
      }}
      onMouseOut={() => {
        setHighlightBox(false);
      }}
      onClick={()=>{router.push("/vaults/"+vault.name)}}
    >
      <Card
        style= {{
          boxShadow: (highlightBox ? "0px 0px 30px rgba(15, 253, 106, 0.4)" : "" ) ,
          border: (highlightBox ? "1px solid #FEF200" : ""),
        }}
        bodyStyle= {{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between", height: '100%', gap: 12, 
        }}
      >
        <div style={{ fontSize: "x-large", marginLeft: 8, display: "flex", flexDirection: "row", gap: 16, alignItems: 'center' }}>
          {vaultDetails.name} {incentiveApr > 0 ? <RewardsTag/> : <></>}
        </div>
        <img src={vaultDetails.icon} alt={vault.name.toLowerCase()} height={164} />
        
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: 'center'
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              Projected APR{" "}
                <Popover
                placement="right"
                title="Projected Fees"
                content={
                  <div style={{ width: 250 }}>
                    Recent fees APR <span style={{ float: 'right'}}>{(parseFloat(vaultDetails.feeApr)).toFixed(2)}%</span>
                      { incentiveApr > 0 ?
                        <>
                          <br/>
                          ARB incentives<span style={{ float: 'right'}}>{(parseFloat(incentiveApr)).toFixed(2)}%</span>
                        </>
                        : <></>
                      }
                  </div>
                }
              >
                <QuestionCircleOutlined />
                </Popover>
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              {(parseFloat(vaultDetails.feeApr + incentiveApr)).toFixed(2)} %
            </span>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              TVL
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.tvl)}
            </span>
        </div>
        {/*<Slider value={filled} disabled={true} style={{marginTop: -12, marginBottom: -8}} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
            <span
              style={{
                fontWeight: "bold",
                color: "grey",
              }}
            >
              Max. Capacity
            </span>
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.maxTvl)}
            </span>
        </div>*/}
        <Divider style={{margin: "12px 0"}} />
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              color: "grey",
            }}
          >
            My Assets
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: "large", fontWeight: 600 }}>
              ${toReadable(vaultDetails.walletValue)}
            </span>
          </div>
        </div>
      </Card>
    </Col>
  )
}
  
export default GeVaultBox;