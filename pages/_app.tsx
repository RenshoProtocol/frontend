import { Web3ReactProvider } from "@web3-react/core";
import { Web3OnboardProvider } from '@web3-onboard/react'
import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";
// import { withPasswordProtect } from "next-password-protect";

import Layout from "../components/layout";
import getLibrary from "../getLibrary";
import { appColorScheme } from "../constants/appColorScheme";

import "../styles/globals.css";
import web3Onboard from "../web3Onboard";

function NextWeb3App({ Component, pageProps }: AppProps) {

  return (
    <ConfigProvider theme={appColorScheme}>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Web3ReactProvider>
        </Web3OnboardProvider>
    </ConfigProvider>
  );
}


export default NextWeb3App;
