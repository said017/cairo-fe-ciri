import { Container, Row, Col, ListGroup } from "react-bootstrap";
// import Sidebar from "../components/Sidebar";
// import MessageForm from "../components/MessageForm";
import { useMoralis, useWeb3Contract, useChain } from "react-moralis";
import { utils } from "ethers";

import milestoneAbi from "../constants/MilestoneNFTv2.json";
import { useEffect, useState } from "react";
import Mint from "../components/Mint";
import Overview from "../components/Overview";

import io from "socket.io-client";
import Users from "../components/users";
import Head from "next/head";
import { chain } from "wagmi";

export default function Explore() {
  const { chainId, account, isWeb3Enabled } = useMoralis();
  const { switchNetwork } = useChain();
  const { runContractFunction } = useWeb3Contract();
  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const [data, setData] = useState([]);
  const [currentPage, setPage] = useState("Overview");
  const [creatorStatus, setCreator] = useState(false);

  const { runContractFunction: seeRegister } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getCreator",
    params: {
      creator: account,
    },
  });

  const { runContractFunction: isCreator } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "isCreator",
    // params: {
    //   creator: account,
    // },
  });

  async function updateUI() {
    let dataCreator = await isCreator();
    setCreator(dataCreator);
  }

  // function sendSocket(message) {
  //   socket.emit(
  //     "test-sending",
  //     "0xc69AC66290aE5bE5022fA10e6a110c11A8CE5987",
  //     message
  //   );
  // }

  useEffect(() => {
    if (isWeb3Enabled && chainId == "0x3e9") {
      updateUI();
    }
  }, [isWeb3Enabled, account, chainId]);

  return (
    <section className="dashboard">
      <Head>
        <title>Explore</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Container fluid>
        <Row>
          <Col>
            {" "}
            {chainId == "0x3e9" ? (
              <Users />
            ) : (
              <span className=" navbar-text justify-content-center">
                <button onClick={() => switchNetwork("0x3e9")}>
                  Change to Klaytn Baobab{" "}
                </button>
              </span>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}
