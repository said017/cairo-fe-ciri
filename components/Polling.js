import {
  Container,
  Row,
  Col,
  Tab,
  Card,
  Button,
  Modal,
  Form,
} from "react-bootstrap";

import "animate.css";
import TrackVisibility from "react-on-screen";
import { useState, useEffect } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import collectibleAbi from "../constants/CollectibleNFT.json";
import daoAbi from "../constants/CiriverseDAO.json";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { utils } from "ethers";
import Loader from "./Loader";
import ciri_vote_Abi from "../constants/abis/ciri_vote.json";
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

const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

const client = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization,
  },
});

export default function Polling() {
  const [showModal, setShowModal] = useState(false);

  const { account, address, status } = useAccount();

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [isMinting, setIsMinting] = useState(false);
  const [isExecuting, setExecuting] = useState(false);
  // file to upload
  const [fileUrl, setFileUrl] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [collectibles, setCollectibles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [hash, setHash] = useState(undefined);
  const [executeIndex, setExecuteIndex] = useState(0);
  const [formInput, updateFormInput] = useState({
    option1: "",
    option2: "",
    time_to_lock: "1",
  });

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const collectibleAddress =
    process.env.NEXT_PUBLIC_COLLECTIBLE_CONTRACT_ADDRESS;
  const voteAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  // const { runContractFunction } = useWeb3Contract();

  // const { runContractFunction: getNumProposals } = useWeb3Contract({
  //   abi: daoAbi,
  //   contractAddress: daoAddress,
  //   functionName: "getNumProposals",
  //   params: {
  //     creator: account,
  //   },
  //   onError: (error) => {},
  // });
  const { contract: ciriContract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const {
    data: tokenId,
    loading: loadingTokenId,
    error: errorTokenId,
    refresh: refreshTokenId,
  } = useStarknetCall({
    contract: ciriContract,
    method: "tokenOfOwnerByIndex",
    args: [toFelt(address), bnToUint256("0")],
    options: {
      watch: false,
    },
  });

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

  const ciri_vote_contract = new Contract(
    ciri_vote_Abi,
    voteAddress,
    new Provider({
      sequencer: {
        // baseUrl: "http://localhost:5050",
        network: "goerli-alpha",
      },
      // sequencer:
      //   "http://localhost:5050/feeder_gateway/call_contract?blockNumber=pending",
    })
  );

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
        calldata: [toFelt(tokenId), 0, executeIndex],
      },
    ],
  });

  useEffect(() => {
    if (isExecuting) {
      executeProposal().then((tx) => setHash(tx.transaction_hash));
    }
  }, [isExecuting]);

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  const {
    data: num,
    loading: loadingNum,
    error: errorNum,
    refresh: refreshNum,
  } = useStarknetCall({
    contract,
    method: "get_num_proposal_by_addr",
    args: [toFelt(address)],
    options: {
      watch: false,
    },
  });

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

  async function updatePollings() {
    setIsFetching(true);
    // let num = await getNumProposals();

    let dataAfter = [];

    if (num) {
      for (let i = 0; i < num; i++) {
        // let data = await runContractFunction({
        //   params: {
        //     abi: daoAbi,
        //     contractAddress: daoAddress,
        //     functionName: "s_proposals",
        //     params: {
        //       creator: account,
        //       index: i,
        //     },
        //   },
        //   onError: (error) => {},
        //   onSuccess: async (success) => {},
        // });
        const data = await ciri_vote_contract.get_proposal_by_addr(
          toFelt(address),
          i
        );
        console.log(data);
        dataAfter.push(data.proposal);
      }

      setCollectibles(dataAfter);
    }

    setIsFetching(false);
  }

  useEffect(() => {
    if (status === "connected") {
      updatePollings();
      refreshTokenId();
    }
  }, [status, account, num]);

  async function createPollings() {
    const { option1, option2 } = formInput;

    if (!option1 || !option2) return;

    try {
      createProposal();
    } catch (error) {}
  }

  const { execute: crtProposal } = useStarknetExecute({
    calls: [
      {
        contractAddress: voteAddress,
        entrypoint: "create_proposal_by_addr",
        calldata: [
          parseInt(toFelt("0x" + ConvertStringToHex(formInput.option1))),
          parseInt(toFelt("0x" + ConvertStringToHex(formInput.option2))),
          parseInt(formInput.time_to_lock) * 3600,
        ],
      },
    ],
  });

  useEffect(() => {
    console.log("masuk sini polling 1");
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        console.log("masuk sini polling");
        setIsMinting(false);
        refreshNum();
        setExecuting(false);
        setHash(undefined);
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  async function createProposal() {
    // create the items and list them on the marketplace

    setIsMinting(true);

    // we want to create the token
    try {
      // transaction = await contract.makeMarketItem(nftaddress, tokenId, price, {value: listingPrice})
      // await transaction.wait()

      await crtProposal().then((tx) => setHash(tx.transaction_hash));

      // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
    } catch {
      setIsMinting(false);
    }

    // list the item for sale on the marketplace
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
            <h4>Pollings</h4>
            <Row className="p-4 justify-content-center text-black">
              {isFetching ? (
                <div className="justify-content-center">
                  <Loader />
                </div>
              ) : collectibles.length > 0 ? (
                collectibles.map((data, i) => {
                  console.log("data loop");
                  console.log(data);
                  let deadline = new Date(
                    parseInt(data.deadline.toString()) * 1000
                  );
                  console.log(deadline);
                  let isOngoing = deadline.getTime() > Date.now();
                  // return <div key={i}>Hello guys</div>;

                  return (
                    <div
                      key={i}
                      className="w-50 card p-4 m-2 justify-content-center shadow-lg"
                    >
                      {tokenId && (
                        <div className="d-flex justify-content-end">
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `http://localhost:3000/polling?addr=${tokenId.tokenId.low.toString()}&id=${i}`
                              );
                            }}
                            variant="outline-primary"
                          >
                            Copy Link
                          </Button>
                        </div>
                      )}

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
                      <Button
                        disabled={
                          isOngoing ||
                          isExecuting ||
                          data.executed.toString() == "1"
                        }
                        variant="primary"
                        className="p-2 mt-3"
                        onClick={async () => {
                          // setExecuting(true);
                          // runContractFunction({
                          //   params: {
                          //     abi: daoAbi,
                          //     contractAddress: daoAddress,
                          //     functionName: "executeProposal",
                          //     params: { creator: account, proposalIndex: i },
                          //   },
                          //   onError: (error) => setIsMinting(false),
                          //   onSuccess: async (success) => {
                          //     await success.wait(1);
                          //     updatePollings();
                          //     setExecuting(false);
                          //     //   updateUI();
                          //   },
                          // });
                          setExecuteIndex(i);
                          setExecuting(true);
                        }}
                      >
                        {isExecuting ? "Executing.." : "Execute"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-white">
                  <img
                    className="w-50"
                    src="/static/images/cat-img-2.svg"
                  ></img>
                  <h3>You haven't setup any Polling</h3>
                  <br />
                </div>
              )}
            </Row>
          </Col>
        </Row>
        <span className="navbar-text">
          <button
            disabled={isMinting}
            onClick={() => {
              handleShowModal();
            }}
            className="vvd shadow-lg"
          >
            <span>{isMinting ? "Submitting..." : "Add Polling"}</span>
          </button>
        </span>
      </Container>

      <Modal
        style={{ zIndex: "9999" }}
        show={showModal}
        onHide={() => {
          handleCloseModal();
          setIsMinting(false);
        }}
        className="text-black"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Pollings</Modal.Title>
        </Modal.Header>
        <Modal.Body className="justify-content-center">
          <div className="justify-content-center ">
            <textarea
              placeholder="Option 1"
              className="mt-2 border rounded p-4 w-100"
              value={formInput.option1}
              onChange={(e) => {
                updateFormInput({ ...formInput, option1: e.target.value });
              }}
            />
            <br />
            <textarea
              placeholder="Option 2"
              className="mt-2 border rounded p-4 w-100"
              value={formInput.option2}
              onChange={(e) => {
                updateFormInput({ ...formInput, option2: e.target.value });
              }}
            />
            <br />
            <p className="mt-2">Polling time Duration (in Hour)</p>
            <input
              //   disabled={!onSale}
              placeholder="Time in Hour"
              className="mt-2 border rounded p-4 w-100"
              type="text"
              name="time"
              value={formInput.time_to_lock}
              onChange={(e) => {
                if (isNaN(e.target.value)) {
                  return;
                }
                updateFormInput({ ...formInput, time_to_lock: e.target.value });
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            disabled={isMinting}
            variant="primary"
            onClick={async () => {
              await createPollings();
              handleCloseModal();
            }}
          >
            {isMinting ? "Creating.." : "Create Polling"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
