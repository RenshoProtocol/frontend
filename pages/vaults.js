import { Button, Card, Row, Col, Divider, Typography } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import GeVaultBox from "../components/goodvaults/geVaultBox";
import useAddresses from "../hooks/useAddresses";

// Display all user assets and positions in all ROE LPs
const GoodVaults = ({}) => {
  const ADDRESSES = useAddresses();
  let vaults = ADDRESSES["lendingPools"];
  
  const allgev = [];

  for( let v of vaults){
    allgev.push(v)

  }

  return (
    <div style={{ width: 1400 }}>
      <Typography.Title>ezVaults</Typography.Title>
      <Row gutter={24} style={{ marginTop: 24 }}>
        {
          allgev.map((gv) => <GeVaultBox vault={gv} key={gv.name} />)
        }
      </Row>
    </div>
  );
};

export default GoodVaults;
