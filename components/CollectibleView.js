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
import collectibleAbi from "../constants/CollectibleNFT.json";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import { useRouter } from "next/router";
let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function CollectibleView() {
  const router = useRouter();
  const { addr } = router.query;

  const { chainId, account, isWeb3Enabled } = useMoralis();
  const { runContractFunction } = useWeb3Contract();
  const [showModal, setShowModal] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [collectibles, setCollectibles] = useState([]);
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
  const collectibleAddress =
    process.env.NEXT_PUBLIC_COLLECTIBLE_CONTRACT_ADDRESS;

  const { runContractFunction: getCollectibles } = useWeb3Contract({
    abi: collectibleAbi,
    contractAddress: collectibleAddress,
    functionName: "getCollectibles",
    params: {
      creator: addr,
    },
  });

  async function updateAllData() {
    setIsFetching(true);
    await updateCollectibles();
    setIsFetching(false);
  }

  async function updateCollectibles() {
    let collectiblesData = await getCollectibles();

    let dataAfter = [];

    await Promise.all(
      collectiblesData.map(async (data, index) => {
        let tokenURIResponse = await (await fetch(data.URI)).json();

        // tokenURIResponse.push({ tokenId: index });

        dataAfter.push({
          ...tokenURIResponse,
          collectibleId: index,
          alreadyMinted: data.minted,
          price: data.price.toString(),
        });
      })
    );

    setCollectibles(dataAfter);
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

  function sendSocketNFT(message) {
    socket.emit("sending-nft", `${addr}`, message);
  }

  async function mintCollectible(collectibleId, price) {
    // create the items and list them on the marketplace

    setIsMinting(true);

    // we want to create the token
    try {
      // transaction = await contract.makeMarketItem(nftaddress, tokenId, price, {value: listingPrice})
      // await transaction.wait()
      //   price = utils.parseEther(price).toString();

      runContractFunction({
        params: {
          abi: collectibleAbi,
          contractAddress: collectibleAddress,
          functionName: "mintToken",
          msgValue: price,
          params: { creator: addr, index: collectibleId },
        },
        onError: (error) => {},
        onSuccess: async (success) => {
          await success.wait(1);
          setIsMinting(false);
          sendSocketNFT(
            `Congrats !. ${account} Mint Collectible NFT: ${collectibleId + 1}`
          );
          updateCollectibles();
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
    <Row className="text-center">
      <Col
        style={{
          background:
            "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
        }}
        className="border border-white p-3 m-3 shadow-lg"
      >
        <h4>Collectibles</h4>
        <Row className="p-4 justify-content-center text-black">
          {isFetching ? (
            <div className="justify-content-center">
              <Loader />
            </div>
          ) : collectibles.length > 0 ? (
            collectibles.map((tokenURIResponse, i) => {
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
                      {text_truncate(tokenURIResponse.description, 65)}{" "}
                      <br></br> (
                      {utils.formatUnits(tokenURIResponse.price, "ether")}{" "}
                      Klay).
                    </Card.Text>
                    <div>
                      <Button
                        disabled={isMinting}
                        onClick={async () => {
                          // PUT MINTING CODE HERE
                          if (
                            !tokenURIResponse.alreadyMinted &&
                            !(account.toUpperCase() == addr.toUpperCase())
                          ) {
                            await mintCollectible(
                              tokenURIResponse.collectibleId,
                              tokenURIResponse.price
                            );
                          } else {
                            // OPENSEA
                            window.open(
                              `https://baobab.scope.klaytn.com/account/0x01Ebab7B1D0Ae2064311E7054844CE5c8dB96d96?tabId=txList`,
                              "_blank"
                            );
                          }
                        }}
                        variant="primary"
                      >
                        {isMinting
                          ? "Minting.."
                          : !tokenURIResponse.alreadyMinted &&
                            !(account.toUpperCase() == addr.toUpperCase())
                          ? "Mint"
                          : "Open Sea"}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          ) : (
            <div className="text-white">
              <img className="w-50" src="/static/images/cat-img-2.svg"></img>
              <h3>Creator haven't setup Collectibles NFT</h3>
              <br />
            </div>
          )}
        </Row>
      </Col>
    </Row>
  );
}
