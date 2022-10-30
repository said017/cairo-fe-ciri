import { Container, Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import { useRouter } from "next/router";

export default function Users() {
  const { chainId, account, isWeb3Enabled } = useMoralis();
  const [funds, setFunds] = useState("0");
  const [donatorsCount, setdonatorsCount] = useState("0");
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

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

  const { runContractFunction: getCreators } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getCreators",
  });

  async function updateFunds() {
    let fundsData = await getFunds();
    fundsData = utils.formatUnits(fundsData, "ether");

    setFunds(fundsData);
  }

  async function updateDonatorsCount() {
    let donatorsData = await getDonatorsCount();
    donatorsData = utils.formatEther(donatorsData);
    setdonatorsCount(donatorsData);
  }

  async function updateMilestones() {
    setIsFetching(true);
    let creatorsData = await getCreators();

    setMilestones(creatorsData);
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
            className="p-3 m-3 shadow-md"
          >
            <h4>Creators</h4>
            <Row className="p-4 justify-content-center text-white">
              {isFetching ? (
                <div className="justify-content-center">
                  <Loader />
                </div>
              ) : milestones.length > 0 ? (
                milestones.map((user, i) => {
                  return (
                    <Card
                      key={i}
                      onClick={() => {
                        router.push(`/creator/${user.addr}`);
                      }}
                      className="m-3 justify-content-center shadow-lg border border-white"
                      style={{
                        width: "18rem",
                        background:
                          "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
                      }}
                    >
                      <div className="pt-4 justify-content-center">
                        <Card.Img
                          style={{
                            objectFit: "cover",
                            height: "300px",
                            width: "15rem",
                          }}
                          src={user.pic}
                        />
                      </div>

                      <Card.Body>
                        <Card.Title>{text_truncate(user.name, 15)}</Card.Title>
                        <Card.Text
                          style={{
                            height: "75px",
                          }}
                        >
                          {text_truncate(user.addr, 15)}
                        </Card.Text>{" "}
                        <div>
                          <Button
                            onClick={() => {
                              router.push(`/creator/${user.addr}`);
                            }}
                            variant="primary"
                          >
                            View
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })
              ) : (
                <div className="text-white">
                  <img
                    className="w-50"
                    src="/static/images/cat-img-2.svg"
                  ></img>
                  <h3>No Creator in Ciri</h3>
                  <br />
                </div>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
