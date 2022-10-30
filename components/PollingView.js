import {
  Container,
  Row,
  Col,
  Tab,
  Nav,
  Card,
  Button,
  Modal,
} from "react-bootstrap";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import collectibleAbi from "../constants/CollectibleNFT.json";
import daoAbi from "../constants/CiriverseDAO.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import { useRouter } from "next/router";

export default function PollingView() {
  const router = useRouter();
  const { addr } = router.query;

  const { chainId, account, isWeb3Enabled } = useMoralis();
  const { runContractFunction } = useWeb3Contract();
  const [showModal, setShowModal] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [isExecuting, setExecuting] = useState(false);
  const [isHolder, setHolder] = useState(false);

  const [collectibles, setCollectibles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [creator, setCreator] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  const [formInput, updateFormInput] = useState({
    option1: true,
    option2: false,
  });

  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const collectibleAddress =
    process.env.NEXT_PUBLIC_COLLECTIBLE_CONTRACT_ADDRESS;
  const daoAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;

  const { runContractFunction: getNumProposals } = useWeb3Contract({
    abi: daoAbi,
    contractAddress: daoAddress,
    functionName: "getNumProposals",
    params: {
      creator: addr,
    },
    onError: (error) => {},
  });

  async function updateAllData() {
    setIsFetching(true);
    await updatePollings();
    setIsFetching(false);
  }

  async function updatePollings() {
    setIsFetching(true);
    let num = await getNumProposals();

    let dataAfter = [];

    for (let i = 0; i < num; i++) {
      let data = await runContractFunction({
        params: {
          abi: daoAbi,
          contractAddress: daoAddress,
          functionName: "s_proposals",
          params: {
            creator: addr,
            index: i,
          },
        },
        onError: (error) => {},
      });
      let isCanVote = await runContractFunction({
        params: {
          abi: daoAbi,
          contractAddress: daoAddress,
          functionName: "IsCanVote",
          params: {
            creator: addr,
            proposalIndex: i,
          },
        },
        onError: (error) => {},
      });

      dataAfter.push({ ...data, canVote: isCanVote });
      //   dataAfter[i]["isCanVote"] = isCanVote;
    }
    // try to check if user is elligible
    let tokenId = await runContractFunction({
      params: {
        abi: milestoneAbi,
        contractAddress: milestoneAddress,
        functionName: "getTokenId",
        params: {
          creator: addr,
          milestoneId: 0,
        },
      },
      onError: (error) => {},
    });
    let countOfNFT = await runContractFunction({
      params: {
        abi: milestoneAbi,
        contractAddress: milestoneAddress,
        functionName: "balanceOf",
        params: {
          account: account,
          id: tokenId,
        },
      },
      onError: (error) => {},
    });
    let holderBool = countOfNFT > 0;
    setHolder(holderBool);

    setCollectibles(dataAfter);
    setIsFetching(false);
  }

  useEffect(() => {
    if (isWeb3Enabled && router.isReady) {
      updateAllData();
    }
  }, [isWeb3Enabled, account, router.isReady]);

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
    <Row className="text-center">
      <Col
        style={{
          background:
            "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
        }}
        className="border border-white p-3 m-3 shadow-lg"
      >
        <h4>Pollings</h4>
        <Row className="p-4 justify-content-center text-black">
          {isFetching ? (
            <div className="justify-content-center">
              <Loader />
            </div>
          ) : collectibles.length > 0 ? (
            collectibles.map((data, i) => {
              let deadline = new Date(
                parseInt(data.deadline.toString()) * 1000
              );
              let isOngoing = deadline.getTime() > Date.now();

              return (
                <div
                  key={i}
                  className="w-50 card p-4 m-2 justify-content-center shadow-lg"
                >
                  <h3 className="pb-3">{isOngoing ? "Ongoing" : "Expired"}</h3>
                  <p className="p-1">
                    {`(${data.votesOpt1} Votes) -  ` + data.option1}
                  </p>
                  <h5 className="p-2">OR</h5>
                  <p className="p-1">
                    {`(${data.votesOpt2} Votes) -  ` + data.option2}
                  </p>
                  <h4 className="p-1">
                    {data.executed
                      ? `Result : ${data.result}`
                      : deadline.toLocaleString()}
                  </h4>
                  {isOngoing ? (
                    <>
                      <div>
                        <input
                          type="radio"
                          id={data.option1}
                          name={"test"}
                          value={data.option1}
                          //default the "abstain" vote to checked
                          defaultChecked={true}
                          onChange={() => {
                            updateFormInput({
                              ...formInput,
                              option1: !formInput.option1,
                              option2: !formInput.option2,
                            });
                          }}
                        />
                        <label htmlFor={"test" + "-" + "1"}>
                          <h5 className="m-2">{data.option1}</h5>
                        </label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id={data.option2}
                          name={"test"}
                          value={data.option2}
                          //default the "abstain" vote to checked
                          defaultChecked={false}
                          onChange={() => {
                            updateFormInput({
                              ...formInput,
                              option1: !formInput.option1,
                              option2: !formInput.option2,
                            });
                          }}
                        />
                        <label htmlFor={"test" + "-" + "1"}>
                          {" "}
                          <h5 className="m-2">{data.option2}</h5>
                        </label>
                      </div>
                      <Button
                        disabled={isVoting || !data.canVote}
                        variant="primary"
                        className="p-2 mt-3"
                        onClick={async () => {
                          setIsVoting(true);
                          let voteValue = 0;
                          if (formInput.option2) {
                            voteValue = 1;
                          }
                          runContractFunction({
                            params: {
                              abi: daoAbi,
                              contractAddress: daoAddress,
                              functionName: "voteOnProposal",
                              params: {
                                creator: addr,
                                proposalIndex: i,
                                vote: voteValue,
                              },
                            },
                            onError: (error) => setIsVoting(false),
                            onSuccess: async (success) => {
                              await success.wait(1);
                              updatePollings();
                              setIsVoting(false);
                              //   updateUI();
                            },
                          });
                        }}
                      >
                        {isVoting ? "Voting..." : "Vote"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={
                        isOngoing || isExecuting || data.executed || !isHolder
                      }
                      variant="primary"
                      className="p-2 mt-3"
                      onClick={async () => {
                        setExecuting(true);
                        runContractFunction({
                          params: {
                            abi: daoAbi,
                            contractAddress: daoAddress,
                            functionName: "executeProposal",
                            params: { creator: account, proposalIndex: i },
                          },
                          onError: (error) => setIsVoting(false),
                          onSuccess: async (success) => {
                            await success.wait(1);
                            updatePollings();
                            setExecuting(false);
                            //   updateUI();
                          },
                        });
                      }}
                    >
                      {isExecuting ? "Executing..." : "Execute"}
                    </Button>
                  )}

                  {/* <div>
                      <div>
                        <input
                          type="radio"
                          id={"test" + "-" + "1"}
                          name={"test"}
                          value={"test"}
                          //default the "abstain" vote to checked
                          defaultChecked={true}
                        />
                        <label htmlFor={"test" + "-" + "1"}>
                          <h5>Test</h5>
                        </label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id={"test" + "-" + "1"}
                          name={"test"}
                          value={"test"}
                          //default the "abstain" vote to checked
                          defaultChecked={false}
                        />
                        <label htmlFor={"test" + "-" + "1"}>{"test 2"}</label>
                      </div>
                    </div> */}
                </div>
              );
            })
          ) : (
            <div className="text-white">
              <img className="w-50" src="/static/images/cat-img-2.svg"></img>
              <h3>Creator haven't setup Polling</h3>
              <br />
            </div>
          )}
        </Row>
      </Col>
    </Row>
  );
}
