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
import ciri_vote_Abi from "../constants/abis/ciri_vote.json";
import ciri_profile_Abi from "../constants/abis/ciri-profile.json";
import ciri_token_Abi from "../constants/abis/Ciri_ERC20.json";
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

export default function PollingView() {
  const router = useRouter();
  const { addr } = router.query;

  const { account, address, status } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [isExecuting, setExecuting] = useState(false);
  const [isHolder, setHolder] = useState(false);
  const [hash, setHash] = useState(undefined);
  const [collectibles, setCollectibles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [creator, setCreator] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [executeIndex, setExecuteIndex] = useState(0);

  const [formInput, updateFormInput] = useState({
    option1: true,
    option2: false,
    value: "0",
    vote: "0",
    voteIndex: "0",
  });

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const voteAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;

  /**
   * Converts an array of utf-8 numerical short strings into a readable string
   * @param {bigint[]} felts - The array of encoded short strings
   * @returns {string} - The readable string
   */
  function feltArrToStr(felts) {
    return felts.reduce(
      (memo, felt) => memo + Buffer.from(felt.toString(16), "hex").toString(),
      ""
    );
  }

  function ConvertStringToHex(str) {
    var arr = [];
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i).toString(16);
    }
    return arr.join("");
  }

  const { contract } = useContract({
    address: voteAddress,
    abi: ciri_vote_Abi,
  });

  const { contract: contract_profile } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const { contract: contract_token } = useContract({
    address: tokenAddress,
    abi: ciri_token_Abi,
  });

  const ciri_vote_contract = new Contract(
    ciri_vote_Abi,
    voteAddress,
    new Provider({
      sequencer: {
        baseUrl: "http://localhost:5050",
        // network: "goerli-alpha",
      },
      // sequencer:
      //   "http://localhost:5050/feeder_gateway/call_contract?blockNumber=pending",
    })
  );

  const {
    data: tokenToMint,
    loading: loadingTokenToMint,
    error: errorTokenToMint,
    refresh: refreshTokenToMint,
  } = useStarknetCall({
    contract: contract_profile,
    method: "get_token_to_mint",
    args: [toFelt(address)],
    options: {
      watch: true,
    },
  });

  const {
    data: ciriBalance,
    loading: loadingciriBalance,
    error: errorciriBalance,
    refresh: refreshciriBalance,
  } = useStarknetCall({
    contract: contract_token,
    method: "balanceOf",
    args: [toFelt(address)],
    options: {
      watch: true,
    },
  });

  const ciri_profile_contract = new Contract(
    ciri_profile_Abi,
    ciriAddress,
    new Provider({
      sequencer: {
        baseUrl: "http://localhost:5050",
        // network: "goerli-alpha",
      },
      // sequencer:
      //   "http://localhost:5050/feeder_gateway/call_contract?blockNumber=pending",
    })
  );

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  const { execute: claim_ciri_token } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "claim",
        calldata: [],
      },
    ],
  });

  const { execute: voteProposal } = useStarknetExecute({
    calls: [
      // {
      //   contractAddress:
      //     "0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488",
      //   entrypoint: "increaseAllowance",
      //   calldata: [
      //     toFelt(ciriAddress),
      //     (parseFloat(formInput.price) * 10 ** 18).toString(),
      //     0,
      //   ],
      // },
      {
        contractAddress: voteAddress,
        entrypoint: "vote_proposal",
        calldata: [
          toFelt(addr),
          0,
          formInput.voteIndex,
          formInput.vote,
          (parseFloat(formInput.value) * 10 ** 18).toString(),
          0,
        ],
      },
    ],
  });

  const { execute: executeProposal } = useStarknetExecute({
    calls: [
      // {
      //   contractAddress:
      //     "0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488",
      //   entrypoint: "increaseAllowance",
      //   calldata: [
      //     toFelt(ciriAddress),
      //     (parseFloat(formInput.price) * 10 ** 18).toString(),
      //     0,
      //   ],
      // },
      {
        contractAddress: voteAddress,
        entrypoint: "execute_proposal",
        calldata: [toFelt(addr), 0, executeIndex],
      },
    ],
  });

  async function updateAllData() {
    setIsFetching(true);
    await updatePollings();
    setIsFetching(false);
  }

  async function updatePollings() {
    setIsFetching(true);

    let dataAfter = [];
    let num = await ciri_vote_contract.get_num_proposal([toFelt(addr), 0]);
    console.log("Num di polling berapa");
    console.log(num);
    if (num) {
      console.log("Polling goes here");
      let isPassed = false;
      const owner = await ciri_profile_contract.ownerOf([toFelt(addr), 0]);
      const milestone = await ciri_profile_contract.get_profile_milestone([
        toFelt(addr),
        0,
      ]);
      const donated = await ciri_profile_contract.get_donated_fund(
        toFelt(address),
        [toFelt(addr), 0]
      );
      let isOwner = toFelt(address) == owner.owner;
      console.log("donated");
      console.log(donated);
      console.log("milestone");
      console.log(milestone);
      if (
        parseFloat(uint256ToBN(donated.fund).toString()) >=
        parseFloat(uint256ToBN(milestone.milestone).toString())
      ) {
        isPassed = true;
      }
      console.log(`isPassed : ${isPassed}`);
      for (let i = 0; i < num; i++) {
        const data = await ciri_vote_contract.get_proposal(
          [toFelt(addr), 0],
          i
        );
        console.log(data);
        dataAfter.push({ ...data.proposal, isPassed, isOwner });
      }
      setCollectibles(dataAfter);
    }

    setIsFetching(false);
  }

  useEffect(() => {
    if (status == "connected" && router.isReady) {
      // refreshNum();
      refreshTokenToMint();
      refreshciriBalance();
      updateAllData();
    }
  }, [status, account, router.isReady]);

  useEffect(() => {
    if (isVoting) {
      voteProposal().then((tx) => setHash(tx.transaction_hash));
    }
  }, [isVoting]);

  useEffect(() => {
    if (isExecuting) {
      executeProposal().then((tx) => setHash(tx.transaction_hash));
    }
  }, [isExecuting]);

  useEffect(() => {
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        // refreshCollectibles();
        refreshTokenToMint();
        refreshciriBalance();
        updateAllData();
        setIsDonating(false);
        setIsVoting(false);
        setExecuting(false);
        setHash(undefined);
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  // useEffect(() => {
  //   if (status === "connected" && router.isReady) {
  //     updateAllData();
  //   }
  // }, [num]);

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
    <>
      <Row className="text-center">
        <Col
          style={{
            background:
              "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
          }}
          className="border border-white p-3 m-3 shadow-lg"
        >
          <h4>Your CIRI Token</h4>
          <Row className="p-4 justify-content-center text-black">
            {isFetching ? (
              <div className="justify-content-center">
                <Loader />
              </div>
            ) : !loadingciriBalance ? (
              <>
                <h2 className="text-white">
                  {parseFloat(uint256ToBN(ciriBalance.balance).toString()) /
                    10 ** 18 +
                    " CIRI"}
                </h2>
                {tokenToMint && (
                  <>
                    <h4 className="text-white">
                      {parseFloat(uint256ToBN(tokenToMint.fund).toString()) /
                        10 ** 18 +
                        " CIRI to Claim"}
                    </h4>
                    <span className="navbar-text justify-content-center">
                      <button
                        disabled={
                          isDonating ||
                          uint256ToBN(tokenToMint.fund).toString() == "0"
                        }
                        onClick={() => {
                          // handleShowModal();
                          // claim the token
                          setIsDonating(true);
                          claim_ciri_token().then((tx) =>
                            setHash(tx.transaction_hash)
                          );
                        }}
                        className="vvd shadow-md"
                      >
                        <span>{isDonating ? "Claiming..." : "Claim"}</span>
                      </button>
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="justify-content-center">
                <Loader />
              </div>
            )}
          </Row>
        </Col>
      </Row>
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
                console.log(deadline);
                let isOngoing = deadline.getTime() > Date.now();

                return (
                  <div
                    key={i}
                    className="w-50 card p-4 m-2 justify-content-center shadow-lg"
                  >
                    <h3 className="pb-3">
                      {isOngoing ? "Ongoing" : "Expired"}
                    </h3>
                    <p className="p-1">
                      {`(${data.votesOpt1.toString()} Votes) -  ` +
                        feltArrToStr([data.option1])}
                    </p>
                    <h5 className="p-2">OR</h5>
                    <p className="p-1">
                      {`(${data.votesOpt2.toString()} Votes) -  ` +
                        feltArrToStr([data.option2])}
                    </p>
                    <h4 className="p-1">
                      {data.executed.toString() == "1"
                        ? `Result : ${feltArrToStr([data.result])}`
                        : deadline.toLocaleString()}
                    </h4>
                    {isOngoing ? (
                      <>
                        <div>
                          <input
                            type="radio"
                            id={feltArrToStr([data.option1])}
                            name={"test"}
                            value={feltArrToStr([data.option1])}
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
                            <h5 className="m-2">
                              {feltArrToStr([data.option1])}
                            </h5>
                          </label>
                        </div>
                        <div>
                          <input
                            type="radio"
                            id={feltArrToStr([data.option2])}
                            name={"test"}
                            value={feltArrToStr([data.option2])}
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
                            <h5 className="m-2">
                              {feltArrToStr([data.option2])}
                            </h5>
                          </label>
                        </div>
                        <Button
                          disabled={
                            isVoting ||
                            !data.isPassed ||
                            data.isOwner ||
                            (ciriBalance &&
                              uint256ToBN(ciriBalance.balance) == 0)
                          }
                          variant="primary"
                          className="p-2 mt-3"
                          onClick={async () => {
                            updateFormInput({
                              ...formInput,
                              voteIndex: i,
                            });
                            // setIsVoting(true);
                            // let voteValue = 0;
                            // if (formInput.option2) {
                            //   voteValue = 1;
                            // }
                            // runContractFunction({
                            //   params: {
                            //     abi: daoAbi,
                            //     contractAddress: daoAddress,
                            //     functionName: "voteOnProposal",
                            //     params: {
                            //       creator: addr,
                            //       proposalIndex: i,
                            //       vote: voteValue,
                            //     },
                            //   },
                            //   onError: (error) => setIsVoting(false),
                            //   onSuccess: async (success) => {
                            //     await success.wait(1);
                            //     updatePollings();
                            //     setIsVoting(false);
                            //     //   updateUI();
                            //   },
                            // });
                            handleShowModal();
                          }}
                        >
                          {isVoting ? "Voting..." : "Vote"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        disabled={
                          isOngoing ||
                          isExecuting ||
                          data.executed.toString() == "1" ||
                          (!data.isPassed && !data.isOwner)
                        }
                        variant="primary"
                        className="p-2 mt-3"
                        onClick={async () => {
                          setExecuteIndex(i);
                          setExecuting(true);
                        }}
                      >
                        {isExecuting ? "Executing..." : "Execute"}
                      </Button>
                    )}
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
      <Modal
        style={{ zIndex: "9999" }}
        show={showModal}
        onHide={handleCloseModal}
        className="text-black"
      >
        <Modal.Header closeButton>
          <Modal.Title>Vote</Modal.Title>
        </Modal.Header>
        <Modal.Body className="justify-content-center">
          <div className="justify-content-center text-black">
            <p>Vote Count (Per Vote Cost 1 CIRI Token)</p>
            <input
              placeholder="Vote Count in Ciri Token"
              className="mt-2 border rounded p-4 w-100"
              type="text"
              name="price"
              value={formInput.price}
              onChange={(e) => {
                if (isNaN(e.target.value)) {
                  return;
                }
                updateFormInput({ ...formInput, value: e.target.value });
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            disabled={isVoting}
            variant="primary"
            onClick={async () => {
              // await donate();
              let vote = formInput.option1 ? 0 : 1;
              updateFormInput({ ...formInput, vote });
              setIsVoting(true);
              handleCloseModal();
            }}
          >
            {isVoting ? "Voting.." : "Vote"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
