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
let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function CreatorView({ address }) {
  const router = useRouter();
  const { addr } = router.query;

  let valueToSend = "0";

  const { chainId, account, isWeb3Enabled } = useMoralis();
  const { runContractFunction } = useWeb3Contract();
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

  const [formInput, updateFormInput] = useState({
    price: "0",
    message: "",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });

  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const { runContractFunction: getFunds } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getFunds",
    params: {
      creator: addr,
    },
  });

  const { runContractFunction: getCreator } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getCreator",
    params: {
      creator: addr,
    },
  });

  const { runContractFunction: getDonatorsCount } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getDonatorsCount",
    params: {
      creator: addr,
    },
  });

  const { runContractFunction: getMilestones } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getMilestones",
    params: {
      creator: addr,
    },
  });

  // const { runContractFunction: donateFund } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "donate",
  //   msgValue: TEST,
  //   params: {
  //     creator: addr,
  //   },
  // });

  async function updateAllData() {
    setIsFetching(true);
    await updateFunds();
    await updateDonatorsCount();
    await updateMilestones();
    await updateCreator();
    setIsFetching(false);
  }

  async function updateFunds() {
    let fundsData = await getFunds();

    fundsData = utils.formatUnits(fundsData, "ether");

    setFunds(fundsData);
  }

  async function updateCreator() {
    let creatorData = await getCreator();

    setCreator(creatorData);
  }

  async function updateDonatorsCount() {
    let donatorsData = await getDonatorsCount();
    donatorsData = donatorsData.toString();
    setdonatorsCount(donatorsData);
  }

  async function updateMilestones() {
    let milestonesData = await getMilestones();

    let dataAfter = [];

    await Promise.all(
      milestonesData.map(async (data, index) => {
        let tokenURIResponse = await (await fetch(data)).json();

        // tokenURIResponse.push({ tokenId: index });

        let isEligible = await runContractFunction({
          params: {
            abi: milestoneAbi,
            contractAddress: milestoneAddress,
            functionName: "isEligibleToMint",
            params: {
              creatorAddress: addr,
              donator: account,
              milestoneId: index,
            },
          },
          onError: (error) => {},
          onSuccess: async (success) => {},
        });

        let tokenId = await runContractFunction({
          params: {
            abi: milestoneAbi,
            contractAddress: milestoneAddress,
            functionName: "getTokenId",
            params: {
              creator: addr,
              milestoneId: index,
            },
          },
          onError: (error) => {},
          onSuccess: async (success) => {},
        });

        let balanceOf = await runContractFunction({
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
          onSuccess: async (success) => {},
        });

        dataAfter.push({
          ...tokenURIResponse,
          milestoneId: index,
          isCanMint: isEligible,
          balanceOf: balanceOf.toString(),
        });
      })
    );

    setMilestones(dataAfter);
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

  async function donate() {
    const { price, message } = formInput;

    if (!price) return;

    setIsDonating(true);

    // let parsedEther = utils.formatUnits(price, "wei");
    // setDonateFund(utils.parseEther(price).toString());
    valueToSend = utils.parseEther(price).toString();

    await runContractFunction({
      params: {
        abi: milestoneAbi,
        contractAddress: milestoneAddress,
        functionName: "donate",
        msgValue: valueToSend,
        params: {
          creator: addr,
        },
      },
      onError: (error) => {},
      onSuccess: async (success) => {
        await success.wait(1);
        sendSocket(`${account} donate : ${price} KLAY. Message : ${message}`);
        updateMilestones();
      },
      onComplete: (success) => {},
    });

    setIsDonating(false);
  }

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

      runContractFunction({
        params: {
          abi: milestoneAbi,
          contractAddress: milestoneAddress,
          functionName: "mintDonatorNFT",
          params: { creator: addr, milestoneId: mlsId },
        },
        onError: (error) => {},
        onSuccess: async (success) => {
          await success.wait(1);
          setIsMinting(false);
          sendSocketNFT(
            `Congrats !. ${account} Mint Milestone NFT: ${mlsId + 1}`
          );
          updateMilestones();
          //   updateUI();
        },
      });

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
          isWeb3Enabled &&
          addr != null && (
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
                  <h5 className="pb-2">{creator.name}</h5>
                  <img
                    src={creator.pic}
                    style={{
                      objectFit: "cover",
                      height: "300px",
                      width: "300px",
                      marginRight: "5px",
                    }}
                  ></img>
                  <span className="navbar-text justify-content-center">
                    <button
                      disabled={
                        isDonating ||
                        account.toUpperCase() == addr.toUpperCase()
                      }
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
                    {donatorsCount} <br></br>
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
                    ) : milestones.length > 0 ? (
                      milestones.map((tokenURIResponse, i) => {
                        return (
                          <Card
                            key={i}
                            className="m-3 justify-content-center shadow-lg"
                            style={{ width: "18rem" }}
                          >
                            <div className="pt-4 justify-content-center">
                              <Card.Img
                                style={{
                                  objectFit: "cover",
                                  height: "300px",
                                  width: "15rem",
                                }}
                                src={tokenURIResponse.image}
                              />
                            </div>

                            <Card.Body>
                              <Card.Title>{tokenURIResponse.name}</Card.Title>
                              <Card.Text
                                style={{
                                  height: "75px",
                                }}
                              >
                                {text_truncate(
                                  tokenURIResponse.description,
                                  65
                                )}{" "}
                                <br></br> ({tokenURIResponse.price} Klay).
                              </Card.Text>
                              <div>
                                <Button
                                  disabled={
                                    (!tokenURIResponse.isCanMint &&
                                      tokenURIResponse.balanceOf == "0") ||
                                    isMinting
                                  }
                                  onClick={async () => {
                                    // PUT MINTING CODE HERE
                                    if (tokenURIResponse.balanceOf == "0") {
                                      await mintMilestone(
                                        tokenURIResponse.milestoneId
                                      );
                                    } else {
                                      // OPENSEA
                                      window.open(
                                        `https://testnets.opensea.io/collection/ciriverse-jfodnapiqk`,
                                        "_blank"
                                      );
                                    }
                                  }}
                                  variant="primary"
                                >
                                  {isMinting
                                    ? "Minting.."
                                    : tokenURIResponse.isCanMint
                                    ? "Mint"
                                    : tokenURIResponse.balanceOf == "0"
                                    ? "Not Eligible"
                                    : "Open Sea"}
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
            <p>Donate in Klay</p>
            <input
              placeholder="Donate in Klay"
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
