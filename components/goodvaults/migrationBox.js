import { useState } from "react";
import useVaultV2 from "../../hooks/useVaultV2";
import { Card, Col, Popover, Button } from "antd";
import { ethers } from "ethers";
import MigrationVault_ABI from "../../contracts/MigrationVault.json";
import useContract from "../../hooks/useContract";
import { useWeb3React } from "@web3-react/core";

const MigrationBox = ({vault, sourceGeVaultAddress, targetGeVault}) => {
  const { account } = useWeb3React();
  const [sourceVaultBal, setSourceVaultBal] = useState(0);
  const migrationVault = useContract("0xf350e47D1db625DA9cfa3A362A13839A550B15Ab", MigrationVault_ABI);
  const sourceVault = useVaultV2({address: sourceGeVaultAddress, name: "old"});
  console.log(sourceVault)
  console.log("Source:", sourceVault, "Target:", targetGeVault)
  
  const migrate = async () => {
    console.log("Migrate liquidity from", sourceVault.address, "to", targetGeVault.address)
    /* we try to migrate, 3 cases
      - can use token0 (enough token0 is available)
      - if it failsm try with token1
      - if that fails too, liquidity should be migrated in several smaller steps. should migration in several steps, which is tricky, but not too likely either if large holders dont migrate last
    */
    const subMigrate = async (usedToken) => {
      try {
        console.log('Migrate with token', usedToken);
        // check approval
        let result;
        result = await sourceVault.contract.allowance(account, migrationVault.address);
        if (result.lt(ethers.utils.parseUnits(sourceVault.wallet, 18))) {
          console.log("Approve Migration contract");
          result = await sourceVault.contract.approve(
            migrationVault.address,
            ethers.constants.MaxUint256
          );
          // loop waiting for allowance to be ready
          for (let k = 0; k< 20; k++){
            let allowance = await sourceVault.contract.allowance(account, migrationVault.address);
            if ( allowance.gte(ethers.utils.parseUnits(sourceVault.wallet, 18)) ) break;
            await delay(2000);
          }
        }
        // migrate - use 0 as amount to migrate all
        result = await migrationVault.migrate(0, usedToken, sourceVault.address, targetGeVault.address)
        return true;
      }
      catch(e){
        console.log(e)
        return false;
      }
    }
    
    let res = subMigrate(vault.baseToken.address);
    if(!res) res = subMigrate(vault.quoteToken.address);
    
    // if(!res) // migration failed
    
  }
  if (sourceVault.wallet == 0) return <></>
  
  return(<Card style={{marginLeft: 64, color: 'white', marginBottom: 24 }} >
      <h4>Migrate old liquidity</h4>
      <Button type="primary" onClick={migrate} >Migrate</Button>
    </Card>
  )
}
  
export default MigrationBox;