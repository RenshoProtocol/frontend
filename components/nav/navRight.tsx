// components/layout.js
import { useWeb3React } from "@web3-react/core";
import Link from 'next/link'
import { TwitterOutlined, MediumOutlined, GithubOutlined, TrophyOutlined } from "@ant-design/icons";
import Account from "./account";
import Rewards from "./rewards";

import NavChain from "./navChain";
import useEagerConnect from "../../hooks/useEagerConnect";

const DAI_TOKEN_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";

const NavRight = () => {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <div style={{ display: "flex", alignItems: "center", fontWeight: 600 }}>
      <a
        href="https://twitter.com/RenshoProtocol"
        target="_blank"
        rel="noreferrer"
        style={{ marginRight: 24, color: "#8A9098" }}
      >
        <TwitterOutlined style={{ fontSize: "larger" }} />
      </a>
      <a
        href="https://github.com/RenshoProtocol/"
        target="_blank"
        rel="noreferrer"
        style={{ marginRight: 24, color: "#8A9098" }}
      >
        <GithubOutlined style={{ fontSize: "larger"}} />
      </a>
      <NavChain />
      <Account triedToEagerConnect={triedToEagerConnect} />
    </div>
  );
};

export default NavRight;
