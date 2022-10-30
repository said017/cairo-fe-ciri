import "../styles/globals.css";

import { useState } from "react";
// import { MoralisProvider } from "react-moralis";
// import { NotificationProvider } from "@web3uikit/core";
import {
  StarknetConfig,
  InjectedConnector,
  StarknetProvider,
} from "@starknet-react/core";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../components/Navigation";
import { useRouter } from "next/router";
import { Provider } from "starknet";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const showHeader =
    router.pathname === "/notification" ||
    router.pathname === "/qrlink" ||
    router.pathname === "/polling"
      ? false
      : true;

  const connectors = [
    new InjectedConnector({ options: { id: "braavos" } }),
    new InjectedConnector({ options: { id: "argentX" } }),
  ];

  return (
    // <MoralisProvider initializeOnMount={false}>
    //   <NotificationProvider>
    // <StarknetProvider
    //   defaultProvider={new Provider({ baseUrl: "http://localhost:5050" })}
    // >
    <StarknetConfig
      connectors={connectors}
      defaultProvider={
        new Provider({
          sequencer: {
            baseUrl: "http://localhost:5050",
            // network: "goerli-alpha",
          },
          // sequencer:
          //   "http://localhost:5050/feeder_gateway/call_contract?blockNumber=pending",
        })
      }
    >
      {showHeader && <Navbar />}
      <Component {...pageProps} />
    </StarknetConfig>
    // </StarknetProvider>

    //   </NotificationProvider>
    // </MoralisProvider>
  );
}

export default MyApp;
