import { useState, useEffect } from "react"
import { useRouter } from "next/router";
import { ThunderboltOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Typography, Row, Col } from "antd";
import Slider from "../../components/design/slider";
import StatsChart from "../../components/goodvaults/statsChart";
import GeVaultForm from "../../components/goodvaults/geVaultForm";
import MigrationBox from "../../components/goodvaults/migrationBox";
import useVaultV2 from "../../hooks/useVaultV2";
import useAddresses from "../../hooks/useAddresses";
import useAssetData from "../../hooks/useAssetData";
import GEPM_ABI from "../../contracts/GoodEntryPositionManager.json";
import { ethers } from "ethers";

const GeVaults = ({}) => {
  const [stats, setStats] = useState({})
  const router = useRouter()
  let { geVaultAddress } = router.query

  const ADDRESSES = useAddresses();

  var vault = ADDRESSES['lendingPools'][0];
  for (let lp of ADDRESSES["lendingPools"]){
    if(lp.name == geVaultAddress) {
      vault = lp;
      break;
    }
  }
  const vaultDetails = useVaultV2(vault);
  console.log('vatde', vaultDetails)
  const customProvider = new ethers.providers.JsonRpcProvider("https://sepolia.blast.io");
  let pmContract = new ethers.Contract(vault.positionManagerV2, GEPM_ABI, customProvider);
  
  
  useEffect(()=>{
    const getData = async() => {
      try {
        let callUtilizationRate = await pmContract.getUtilizationRate(true, 0)
        let putUtilizationRate = await pmContract.getUtilizationRate(false, 0)

        let stat = {
          name: vault.name,          
          callUtilizationRate: callUtilizationRate.toNumber(),
          putUtilizationRate: putUtilizationRate.toNumber(),
        }

        setStats(stat)
      }
      catch(e){console.log('get info', e)}
    }
    if(pmContract) getData()
  }, [pmContract.address])
  


  const RewardsTag = () => {
    return (<div style={{backgroundColor: "#0A371B", color: "#0FFD6A", borderRadius: 4, padding: "6px 8px", display: 'flex', alignItems: 'center', fontWeight: 600 }}>
      {/*<img src="/logo.svg" height={15} alt='Good Entry Logo' style={{ marginRight:4 }} />*/}
      Rewards
    </div>)
  }
  const VaultTag = () => {
    return (<div style={{backgroundColor: "#0A371B", color: "#0FFD6A", borderRadius: 4, padding: "6px 8px", display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 11 }}>
      <ThunderboltOutlined style={{marginRight: 4}}/>
      ezVault
    </div>)
  }
    
  const DisabledTag = () => {
    return (<div style={{ backgroundColor: "#DC4446", color: 'white', borderRadius: 4, padding: "6px 8px", display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: "smaller" }}>
      <WarningOutlined style={{ marginRight:4 }} />
      Withdraw Only
    </div>)
  }

  const filled = Math.round(100 * vaultDetails.tvl / vaultDetails.maxTvl);

  return (
  <div style={{ marginTop: -25, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100vw'}}>
    <Card style={{ 
      display: 'flex', justifyContent: 'center',
      width:'100vw',
      padding: 18, borderTop: '3px solid', borderBottom: '3px solid',  borderImageSlice: 1, 
      borderImageSource: 'linear-gradient(to left, rgba(15, 253, 106, 0.29) 0%, rgba(0, 124, 48, 1)  100%)', marginBottom: 48, borderLeft: 0, borderRight: 0,
      boxShadow: `0px 4px 20px rgba(15, 253, 106, 0.5)`
    }}
    >
      <Row style={{ width: 1200}}>
        <Col md={12}>
          <div style={{display: 'flex', gap: 12}}><VaultTag />
            { vaultDetails.status == "Withdraw Only" ? <DisabledTag /> : <></> }
          </div>
          <Typography.Title style={{ marginTop: 12 }}>
            {vaultDetails.name}
          </Typography.Title>
          <div style={{ width: '350px', marginTop: 12, color: 'white'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between'}}>
              <span>Current Deposits</span>
              <span>${parseFloat(vaultDetails.tvl).toFixed(0)}</span>
            </div>
            <Slider value={filled} disabled={true} />
            <div style={{ display: 'flex', justifyContent: 'space-between'}}>
              <span>Max. Capacity</span>
              <span>${vaultDetails.maxTvl}</span>
            </div>
          </div>
        </Col>
        <Col md={12}>
          <img src={vaultDetails.icon}  alt={vault.name.toLowerCase()} height={196} style={{float: 'right'}} />
        </Col>
      </Row>
    </Card>
    
    <Row style={{ width: 1200 }}>
      <Col
        md={15}
        xs={24}
      >
        <Typography.Title level={2}>
          EzVault Strategy
        </Typography.Title>
        <Typography.Text>There are 2 main ways that this vault earns yield. Firstly, supply apy by providing liquidity for traders to take on leveraged protected perp position(s). Secondly, amm swap fees as the liquidity is deposited into an underlying AMM. The vault reinvests the yield earned back into the strategy, effectively compounding the yields for users over time.  Users can deposit and withdraw from the ezVault at any point in time.
        </Typography.Text>
        
        {/*<Typography.Title level={2}>Vault Stats</Typography.Title>
        <Typography.Text>
            <strong>Vault {stats.name}</strong><br/>
            Positions: {stats.totalSupply} NFTs<br/>
            Call u.rate: {stats.callUtilizationRate}%<br/>
            Put u.rate: {stats.putUtilizationRate}%<br/>
        </Typography.Text>
        */}
        <Typography.Title level={2}>Performance</Typography.Title>
        <Card style={{ marginTop: 24, height: 300 }}>
          <StatsChart vault={vault} vaultDetails={vaultDetails} />
        </Card>
        <Typography.Text>
          Projected APR is based on past 30 days average.
        </Typography.Text>
        <Typography.Title level={2}>Fee Structure</Typography.Title>
        <Typography.Text>
          There is a one-time deposit and withdraw fee. The base fee is 0.2%.
          <br/>
          Depending on the vault underlying assets imbalance, that fee is automatically adjusted from 0.1% to 0.3%.
        </Typography.Text>
        
        <Typography.Title level={2}>Risks</Typography.Title>
        <Typography.Text>
          The primary risk for running this strategy is extreme market volatility. Rensho only allows limited open interest against the vaults, and should be profitable on average but extreme market events can lead to temporary losses. 
          <br/><br/>
          The Rensho smart contracts were audited by Veridise and Peckshield. Users are still advised to exercise caution and only risk funds that they can afford to lose. 
        </Typography.Text>
      </Col>
      <Col
        md={9}
        xs={24}
      >
        { /* From v1 ETH-USDC.e to GEv2 */
          vault.address == "0x36003A975bFC56f650590C26B1479ba423217931" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0x0d3cAA624E3a0076A6bc96Ba8D632D37F460Bc74" targetGeVault={vault} /> 
            : <></>
        }
        { /* From alpha ETH-USDC.e to GEv2 */
          vault.address == "0x36003A975bFC56f650590C26B1479ba423217931" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0x59fA26382De900F29B581553F31C6Da103884ffA" targetGeVault={vault} /> 
            : <></>
        }
        { /* From GEv1-v2 ETH-USDC.e to GEv2 */
          vault.address == "0x36003A975bFC56f650590C26B1479ba423217931" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0x41D0ebB0F0Bcf7A06E395D0551Cc695e4318594d" targetGeVault={vault} /> 
            : <></>
        }
        { /* From alpha ARB-USDC.e to v2 */
          vault.address == "0xd5fE1A54fA642400ef559d866247cCE66049141B" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0x31C3871B369bE1B2C3A26f963bcc407ee208099E" targetGeVault={vault} /> 
            : <></>
        }
        { /* From v1 ARB-USDC.e to v2 */
          vault.address == "0xd5fE1A54fA642400ef559d866247cCE66049141B" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0x14475be7D59895739207a9E5518903f4B94345B7" targetGeVault={vault} /> 
            : <></>
        }
        { /* From v1-2 ARB-USDC.e to v2 */
          vault.address == "0xd5fE1A54fA642400ef559d866247cCE66049141B" 
            ? <MigrationBox vault={vault} sourceGeVaultAddress="0xbB59f5324FeA11E538fC7f46C3C7bFE5Ad36e8b9" targetGeVault={vault} /> 
            : <></>
        }
        <GeVaultForm vault={vault} vaultDetails={vaultDetails} />
      </Col>
    </Row>
  </div>)
};

export default GeVaults;