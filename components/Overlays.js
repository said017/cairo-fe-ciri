import { Container, Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import QRCode from "react-qr-code";

export default function Overlays() {
  const { chainId, account, isWeb3Enabled } = useMoralis();
  const [funds, setFunds] = useState("0");
  const [donatorsCount, setdonatorsCount] = useState("0");
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const { runContractFunction: getFunds } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getFunds",
    params: {
      creator: account,
    },
  });

  const { runContractFunction: getDonatorsCount } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getDonatorsCount",
    params: {
      creator: account,
    },
  });

  const { runContractFunction: getMilestones } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getMilestones",
    params: {
      creator: account,
    },
  });

  async function updateFunds() {
    let fundsData = await getFunds();
    fundsData = utils.formatUnits(fundsData, "ether");

    setFunds(fundsData);
  }

  async function updateDonatorsCount() {
    let donatorsData = await getDonatorsCount();
    donatorsData = donatorsData.toString();
    setdonatorsCount(donatorsData);
  }

  async function updateMilestones() {
    setIsFetching(true);
    let milestonesData = await getMilestones();

    let dataAfter = [];

    await Promise.all(
      milestonesData.map(async (data, index) => {
        let tokenURIResponse = await (await fetch(data)).json();

        dataAfter.push(tokenURIResponse);
      })
    );

    setMilestones(dataAfter);
    setIsFetching(false);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateFunds();
      updateDonatorsCount();
      updateMilestones();
    }
  }, [isWeb3Enabled, account]);

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
            <p className="pb-2">{`https://ciriverse.xyz/notification?addr=${account}&mint=false`}</p>
            <span className=" navbar-text justify-content-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://ciriverse.xyz/notification?addr=${account}&mint=false`
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
            <p className="pb-2">{`https://ciriverse.xyz/notification?addr=${account}&mint=true`}</p>
            <span className=" navbar-text justify-content-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://ciriverse.xyz/notification?addr=${account}&mint=true`
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
                value={`https://ciriverse.xyz/creator/${account}`}
                viewBox={`0 0 256 256`}
              />
            </div>

            <br />
            <span className=" navbar-text justify-content-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `https://ciriverse.xyz/qrlink?addr=${account}`
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
    </section>
  );
}
