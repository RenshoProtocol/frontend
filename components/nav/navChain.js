import React from "react";
import { Button } from "antd";
import { useSetChain } from "@web3-onboard/react";

const NavChain = () => {
  const [
    {
      connectedChain
    },
  ] = useSetChain() ?? {};

  const chainId = Number(connectedChain?.id);

  const onClick = async ({ key }) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + parseInt(key).toString(16) }],
      });
    } catch (e) {
      console.log("Switch chain", e);
    }
  };

  if (!chainId) return <></>;

  const items = [
    {
      key: "168587773",
      label: "Blast-Sepolia",
      icon: (
        <img
          src="/icons/b.svg"
          height={16}
          width={16}
          alt="Blast Logo"
        />
      ),
    },
  ];

  let label = {};
  for (let k of items) if (k.key == chainId) label = k;

  return (
    <Button
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
        gap: 8
      }}
      icon={label.icon}
      onClick={()=>{onClick({key: "168587773"})}}
    >
      {label.label ? label.label : "Wrong Network"}
    </Button>
  );
};

export default NavChain;
