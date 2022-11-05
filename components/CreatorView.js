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
import io from "socket.io-client";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import { useRouter } from "next/router";
import CollectibleView from "./CollectibleView";
import PollingView from "./PollingView";
import ciri_profile_Abi from "../constants/abis/ciri-profile.json";
import ciri_token_Abi from "../constants/abis/Ciri_ERC20.json";
let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

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

export default function CreatorView({ addrs }) {
  const router = useRouter();
  const { addr } = router.query;

  let valueToSend = "0";

  const { account, address, status } = useAccount();
  // const { runContractFunction } = useWeb3Contract();
  const [showModal, setShowModal] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [funds, setFunds] = useState("0");
  const [donatorsCount, setdonatorsCount] = useState("0");
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [creator, setCreator] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [hash, setHash] = useState(undefined);
  const [profiles, setProfiles] = useState(null);

  const [formInput, updateFormInput] = useState({
    price: "0",
    message: "",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const { contract: contract_token } = useContract({
    address: tokenAddress,
    abi: ciri_token_Abi,
  });

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  const {
    data: profiles_data,
    loading: loadingProfile,
    error: errorProfile,
    refresh: refreshBalance,
  } = useStarknetCall({
    contract,
    method: "get_profile_by_id",
    args: [[toFelt(addr), 0]],
    options: {
      watch: true,
    },
  });

  const {
    data: donators_count,
    loading: loadingCount,
    error: errorCount,
    refresh: refreshCount,
  } = useStarknetCall({
    contract,
    method: "get_donators_count_by_id",
    args: [[toFelt(addr), 0]],
    options: {
      watch: true,
    },
  });

  const {
    data: milestone,
    loading: loadingMilestone,
    error: errorMilestone,
    refresh: refreshMilestone,
  } = useStarknetCall({
    contract,
    method: "get_profile_milestone",
    args: [[toFelt(addr), 0]],
    options: {
      watch: true,
    },
  });

  const { execute: donate_fund } = useStarknetExecute({
    calls: [
      {
        contractAddress:
          "0x62230ea046a9a5fbc261ac77d03c8d41e5d442db2284587570ab46455fd2488",
        entrypoint: "increaseAllowance",
        calldata: [
          toFelt(ciriAddress),
          (parseFloat(formInput.price) * 10 ** 18).toString(),
          0,
        ],
      },
      {
        contractAddress: ciriAddress,
        entrypoint: "donate",
        calldata: [
          toFelt(addr),
          0,
          (parseFloat(formInput.price) * 10 ** 18).toString(),
          0,
        ],
      },
    ],
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

  const ciri_profile_contract = new Contract(
    ciri_profile_Abi,
    ciriAddress,
    new Provider({
      sequencer: {
        // baseUrl: "http://localhost:5050",
        network: "goerli-alpha",
      },
      // sequencer:
      //   "http://localhost:5050/feeder_gateway/call_contract?blockNumber=pending",
    })
  );

  async function updateAllData() {
    setIsFetching(true);
    let dataAfter = [];
    if (profiles_data) {
      const owner = await ciri_profile_contract.ownerOf([toFelt(addr), 0]);
      let isOwner = toFelt(address) == owner.owner;
      console.log("masuk sini profiles_data");
      const pic = await ciri_profile_contract.get_profile_img_id([
        profiles_data.creator_id.low.toString(),
        profiles_data.creator_id.high.toString(),
      ]);
      console.log("PIC");
      console.log(pic);
      const img_url = feltArrToStr(pic.uri_img);

      dataAfter.push({ ...profiles_data, pic: img_url, isOwner });
    }
    console.log(dataAfter);
    setProfiles(dataAfter);

    // await updateFunds();
    // await updateDonatorsCount();
    // await updateMilestones();
    // await updateCreator();
    setIsFetching(false);
  }

  useEffect(() => {
    if (status == "connected" && router.isReady) {
      refreshBalance();
      refreshCount();
      console.log("profiles nih");
      console.log(profiles);
    }
  }, [status, account, router.isReady]);

  useEffect(() => {
    if (status == "connected" && router.isReady) {
      updateAllData();
      console.log("profiles nih");
      console.log(profiles);
    }
  }, [router.isReady, profiles_data, donators_count]);

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

  async function donate() {
    const { price, message } = formInput;

    if (!price) return;

    setIsDonating(true);

    // let parsedEther = utils.formatUnits(price, "wei");
    // setDonateFund(utils.parseEther(price).toString());
    valueToSend = utils.parseEther(price).toString();

    await donate_fund().then((tx) => setHash(tx.transaction_hash));

    // await runContractFunction({
    //   params: {
    //     abi: milestoneAbi,
    //     contractAddress: milestoneAddress,
    //     functionName: "donate",
    //     msgValue: valueToSend,
    //     params: {
    //       creator: addr,
    //     },
    //   },
    //   onError: (error) => {},
    //   onSuccess: async (success) => {
    //     await success.wait(1);
    //     sendSocket(`${account} donate : ${price} KLAY. Message : ${message}`);
    //     updateMilestones();
    //   },
    //   onComplete: (success) => {},
    // });
  }

  useEffect(() => {
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        // refreshCollectibles();
        refreshBalance();
        refreshCount();
        if (isDonating) {
          sendSocket(
            `${address} donate : ${formInput.price} ETH. Message : ${formInput.message}`
          );
        }
        setIsDonating(false);
        setHash(undefined);
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  function sendSocket(message) {
    socket.emit("sending-donate", `${addr}`, message);
  }

  function sendSocketNFT(message) {
    socket.emit("sending-nft", `${addr}`, message);
  }

  async function mintMilestone(mlsId) {
    // create the items and list them on the marketplace

    setIsMinting(true);

    // we want to create the token
    try {
      // transaction = await contract.makeMarketItem(nftaddress, tokenId, price, {value: listingPrice})
      // await transaction.wait()
      // runContractFunction({
      //   params: {
      //     abi: milestoneAbi,
      //     contractAddress: milestoneAddress,
      //     functionName: "mintDonatorNFT",
      //     params: { creator: addr, milestoneId: mlsId },
      //   },
      //   onError: (error) => {},
      //   onSuccess: async (success) => {
      //     await success.wait(1);
      //     setIsMinting(false);
      //     sendSocketNFT(
      //       `Congrats !. ${account} Mint Milestone NFT: ${mlsId + 1}`
      //     );
      //     updateMilestones();
      //     //   updateUI();
      //   },
      // });
      // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
    } catch {
      console.error("Too long waited to mint, go to main page");

      setIsMinting(false);
    }

    // list the item for sale on the marketplace
  }

  return (
    <section>
      <Container className="p-5 justify-content-center" fluid>
        {isFetching ? (
          <div className="d-flex justify-content-center">
            <Loader />
          </div>
        ) : (
          status == "connected" &&
          addr != null &&
          profiles != null &&
          profiles.length > 0 && (
            <>
              <Row className="text-center">
                <Col
                  style={{
                    background:
                      "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
                  }}
                  className="border border-white p-3 m-3 shadow-lg"
                >
                  <h4 className="pb-2">Creator</h4>
                  <h5 className="pb-2">{feltArrToStr([profiles[0].name])}</h5>
                  <img
                    src={profiles[0].pic}
                    className="pb-2"
                    style={{
                      objectFit: "cover",
                      height: "300px",
                      width: "300px",
                      marginRight: "5px",
                    }}
                  ></img>
                  <span className="navbar-text justify-content-center">
                    <button
                      disabled={isDonating || profiles[0].isOwner}
                      onClick={() => {
                        handleShowModal();
                      }}
                      className="vvd shadow-md"
                    >
                      <span>{isDonating ? "Donating..." : "Support"}</span>
                    </button>
                  </span>
                </Col>
                <Col
                  style={{
                    background:
                      "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
                  }}
                  className="border border-white p-3 m-3 shadow-lg"
                >
                  <h4
                    style={{
                      height: "150px",
                    }}
                    className="pb-3"
                  >
                    Total Supporters <br></br>
                  </h4>

                  <h2
                    style={{
                      height: "170px",
                    }}
                  >
                    {donators_count && donators_count.toString()} <br></br>
                  </h2>

                  <h3>Supportes</h3>
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
                  <h4>Milestones</h4>
                  <Row className="p-4 justify-content-center text-black">
                    {isFetching ? (
                      <div className="justify-content-center">
                        <Loader />
                      </div>
                    ) : milestone ? (
                      <h2 className="text-white">
                        {parseFloat(
                          uint256ToBN(milestone.milestone).toString()
                        ) /
                          10 ** 18 +
                          " ETH"}
                      </h2>
                    ) : (
                      <div className="text-white">
                        <img
                          className="w-50"
                          src="/static/images/cat-img-2.svg"
                        ></img>
                        <h3>Creator haven't setup Milestones NFT</h3>
                        <br />
                      </div>
                    )}
                  </Row>
                </Col>
              </Row>
              <CollectibleView />
              <PollingView />
            </>
          )
        )}
      </Container>

      <Modal
        style={{ zIndex: "9999" }}
        show={showModal}
        onHide={handleCloseModal}
        className="text-black"
      >
        <Modal.Header closeButton>
          <Modal.Title>Donate</Modal.Title>
        </Modal.Header>
        <Modal.Body className="justify-content-center">
          <div className="justify-content-center text-black">
            <p>Donate in Eth</p>
            <input
              placeholder="Donate in Eth"
              className="mt-2 border rounded p-4 w-100"
              type="text"
              name="price"
              value={formInput.price}
              onChange={(e) => {
                if (isNaN(e.target.value)) {
                  return;
                }
                updateFormInput({ ...formInput, price: e.target.value });
              }}
            />
            <br />
            <textarea
              placeholder="Message (Optional)"
              className="mt-2 border rounded p-4 w-100"
              value={formInput.message}
              onChange={(e) => {
                updateFormInput({ ...formInput, message: e.target.value });
              }}
            />

            <br />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            disabled={isDonating}
            variant="primary"
            onClick={async () => {
              await donate();
              handleCloseModal();
            }}
          >
            {isDonating ? "Creating.." : "Donate"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
