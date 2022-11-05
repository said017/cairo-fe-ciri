import { Container, Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import QRCode from "react-qr-code";
import ciri_profile_Abi from "../constants/abis/ciri-profile.json";
import { toHex, toHexString, toFelt } from "starknet/utils/number";
import { uint256ToBN, bnToUint256 } from "starknet/dist/utils/uint256";
import {
  useAccount,
  useConnectors,
  useContract,
  useNetwork,
  useStarknetCall,
  useStarknet,
  useStarknetExecute,
  useTransactionReceipt,
} from "@starknet-react/core";
import { Contract, Provider } from "starknet";

export default function Overlays() {
  // const { chainId, account, isWeb3Enabled } = useMoralis();
  const { account, address, status } = useAccount();
  const [funds, setFunds] = useState("0");
  const [donatorsCount, setdonatorsCount] = useState("0");
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const {
    data: tokenId,
    loading: loadingTokenId,
    error: errorTokenId,
    refresh: refreshTokenId,
  } = useStarknetCall({
    contract,
    method: "tokenOfOwnerByIndex",
    args: [toFelt(address), bnToUint256("0")],
    options: {
      watch: false,
    },
  });
  // const { runContractFunction: getFunds } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getFunds",
  //   params: {
  //     creator: account,
  //   },
  // });

  // const { runContractFunction: getDonatorsCount } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getDonatorsCount",
  //   params: {
  //     creator: account,
  //   },
  // });

  // const { runContractFunction: getMilestones } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getMilestones",
  //   params: {
  //     creator: account,
  //   },
  // });

  // async function updateFunds() {
  //   let fundsData = await getFunds();
  //   fundsData = utils.formatUnits(fundsData, "ether");

  //   setFunds(fundsData);
  // }

  // async function updateDonatorsCount() {
  //   let donatorsData = await getDonatorsCount();
  //   donatorsData = donatorsData.toString();
  //   setdonatorsCount(donatorsData);
  // }

  // async function updateMilestones() {
  //   setIsFetching(true);
  //   let milestonesData = await getMilestones();

  //   let dataAfter = [];

  //   await Promise.all(
  //     milestonesData.map(async (data, index) => {
  //       let tokenURIResponse = await (await fetch(data)).json();

  //       dataAfter.push(tokenURIResponse);
  //     })
  //   );

  //   setMilestones(dataAfter);
  //   setIsFetching(false);
  // }

  useEffect(() => {
    if (status == "connected") {
      // updateFunds();
      refreshTokenId();
      // updateDonatorsCount();
      // updateMilestones();
    }
  }, [status, account, address]);

  function text_truncate(str, length, ending) {
    if (length == null) {
      length = 100;
    }
    if (ending == null) {
      ending = "...";
    }
    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    } else {
      return str;
    }
  }

  return (
    <section>
      {tokenId ? (
        <Container fluid>
          <Row className="text-center">
            <Col
              style={{
                background:
                  "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
              }}
              className="border border-white p-3 m-3 shadow-lg"
            >
              <h4 className="pb-2">Donate Overlay</h4>
              <p className="pb-2">{`http://localhost:3000/notification?addr=${tokenId.tokenId.low.toString()}&mint=false`}</p>
              <span className=" navbar-text justify-content-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `http://localhost:3000/notification?addr=${tokenId.tokenId.low.toString()}&mint=false`
                    );
                  }}
                  className="vvd shadow-md"
                >
                  <span>Copy Link</span>
                </button>
              </span>
            </Col>
          </Row>
          <br />
          <Row className="text-center">
            <Col
              style={{
                background:
                  "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
              }}
              className="border border-white p-3 m-3 shadow-lg"
            >
              <h4 className="pb-2">Milestone NFT Mint Overlay</h4>
              <p className="pb-2">{`http://localhost:3000/notification?addr=${tokenId.tokenId.low.toString()}&mint=true`}</p>
              <span className=" navbar-text justify-content-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `http://localhost:3000/notification?addr=${tokenId.tokenId.low.toString()}&mint=true`
                    );
                  }}
                  className="vvd shadow-md"
                >
                  <span>Copy Link</span>
                </button>
              </span>
            </Col>
          </Row>
          <br />
          <Row className="text-center">
            <Col
              style={{
                background:
                  "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
              }}
              className="border border-white p-3 m-3 shadow-lg"
            >
              <h4 className="pb-2">QR Link</h4>
              <br />
              <div
                style={{
                  height: "auto",
                  margin: "0 auto",
                  maxWidth: 300,
                  width: "100%",
                }}
              >
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={`http://localhost:3000/creator/${tokenId.tokenId.low.toString()}`}
                  viewBox={`0 0 256 256`}
                />
              </div>

              <br />
              <span className=" navbar-text justify-content-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `http://localhost:3000/qrlink?addr=${tokenId.tokenId.low.toString()}`
                    );
                  }}
                  className="vvd shadow-md"
                >
                  <span>Copy Link</span>
                </button>
              </span>
            </Col>
          </Row>
        </Container>
      ) : (
        <div className="justify-content-center">
          <Loader />
        </div>
      )}
    </section>
  );
}
