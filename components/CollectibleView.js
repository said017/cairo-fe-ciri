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
// let socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

export default function CollectibleView() {
  const router = useRouter();
  const { addr } = router.query;

  // const { chainId, account, isWeb3Enabled } = useMoralis();
  // const { runContractFunction } = useWeb3Contract();
  const { account, address, status } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  const [hash, setHash] = useState(undefined);

  const [collectibles, setCollectibles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [creator, setCreator] = useState([]);
  const [isMinting, setIsMinting] = useState(false);
  const [isBuy, setIsBuy] = useState(false);
  const [buyIndex, setBuyIndex] = useState(0);

  const [formInput, updateFormInput] = useState({
    price: "0",
    message: "",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const collectibleAddress =
    process.env.NEXT_PUBLIC_COLLECTIBLE_CONTRACT_ADDRESS;

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

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  function strToFeltArr(str) {
    const size = Math.ceil(str.length / 31);
    const arr = Array(size);

    let offset = 0;
    for (let i = 0; i < size; i++) {
      const substr = str.substring(offset, offset + 31).split("");
      const ss = substr.reduce(
        (memo, c) => memo + c.charCodeAt(0).toString(16),
        ""
      );
      arr[i] = BigInt("0x" + ss).toString();
      offset += 31;
    }
    return arr;
  }

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

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  useEffect(() => {
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        // refreshCollectibles();

        setIsMinting(false);
        setHash(undefined);
        updateAllData();
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  // const {
  //   data: tokenId,
  //   loading: loadingTokenId,
  //   error: errorTokenId,
  //   refresh: refreshTokenId,
  // } = useStarknetCall({
  //   contract,
  //   method: "tokenOfOwnerByIndex",
  //   args: [toFelt(address), bnToUint256("0")],
  //   options: {
  //     watch: false,
  //   },
  // });

  // const { runContractFunction: getCollectibles } = useWeb3Contract({
  //   abi: collectibleAbi,
  //   contractAddress: collectibleAddress,
  //   functionName: "getCollectibles",
  //   params: {
  //     creator: addr,
  //   },
  // });

  async function updateAllData() {
    setIsFetching(true);
    await updateCollectibles();
    setIsFetching(false);
  }

  async function updateCollectibles() {
    setIsFetching(true);
    // let collectiblesData = await getCollectibles();
    let dataAfter = [];
    // await Promise.all(
    //   collectiblesData.map(async (data) => {
    //     const tokenURIResponse = await (await fetch(data.URI)).json();
    //     dataAfter.push(tokenURIResponse);
    //   })
    // );
    // setCollectibles(dataAfter);
    // setIsFetching(false);
    if (addr) {
      console.log("TokenID");
      console.log(addr);
      const col_counts = await ciri_profile_contract.get_collectibles_count([
        toFelt(addr),
        0,
      ]);
      if (col_counts > 0) {
        console.log("masuk sini uri col");
        console.log(col_counts);
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
        for (let i = 0; i < parseInt(col_counts.count.toString()); i++) {
          console.log("masuk sini ga yah");
          const uri = await ciri_profile_contract.get_collectible_img_id(
            [toFelt(addr), 0],
            // collectible_data.collectible[0].profile_id,
            i + 1
          );
          const collectible = await ciri_profile_contract.get_collectible_at(
            [toFelt(addr), 0],
            // collectible_data.collectible[0].profile_id,
            i + 1
          );

          // parseFloat(uint256ToBN(milestone.milestone).toString())

          console.log(uri);
          console.log(`Collectible at ${i}`);
          console.log(collectible.collectible.minted.toString());

          const tokenURIResponse = await (
            await fetch(feltArrToStr(uri.uri_img))
          ).json();
          dataAfter.push({
            ...tokenURIResponse,
            minted: collectible.collectible.minted.toString(),
            gated: collectible.collectible.gated.toString(),
            isPassed,
            isOwner,
          });
          console.log(tokenURIResponse);
        }
        // await Promise.all(
        //   col_counts.collectible.map(async (data, i) => {
        //     console.log("masuk sini ga ayah");
        //     const uri = await ciri_profile_contract.get_collectible_img_id(
        //       [tokenId.low.toString(), tokenId.high.toString()],
        //       // collectible_data.collectible[0].profile_id,
        //       i + 1
        //     );
        //     console.log(uri);

        //     const tokenURIResponse = await (
        //       await fetch(feltArrToStr(uri.uri_img))
        //     ).json();
        //     dataAfter.push(tokenURIResponse);
        //     console.log(tokenURIResponse);
        //   })
        // );
        setCollectibles(dataAfter);
        setIsFetching(false);
      }
    }
    setIsFetching(false);
    // console.log(tokenId);
    // console.log(loadingTokenId);
    // if (tokenId) {
    //   console.log("TokenId");
    //   console.log(tokenId.tokenId.low.toString());
    //   setTokenLow(tokenId.tokenId.low.toString());
    //   setTokenHigh(tokenId.tokenId.high.toString());
    // }
  }

  const { execute: mintCollectibleCall } = useStarknetExecute({
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
        entrypoint: "mint_collectible",
        calldata: [
          toFelt(addr),
          0,
          buyIndex,
          (parseFloat(formInput.price) * 10 ** 18).toString(),
          0,
        ],
      },
    ],
  });

  useEffect(() => {
    if (status == "connected" && router.isReady) {
      updateAllData();
    }
  }, [status, account, router.isReady]);

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

  // function sendSocketNFT(message) {
  //   socket.emit("sending-nft", `${addr}`, message);
  // }
  useEffect(() => {
    if (isBuy) {
      mintCollectible();
      setIsBuy(false);
    }
  }, [isBuy]);

  async function mintCollectible() {
    // create the items and list them on the marketplace

    setIsMinting(true);

    // we want to create the token
    try {
      await mintCollectibleCall().then((tx) => setHash(tx.transaction_hash));
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
              console.log("gated here?");
              console.log(tokenURIResponse.gated);
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
                      <br></br> ({tokenURIResponse.price} ETH).
                    </Card.Text>
                    <div>
                      <Button
                        disabled={
                          isMinting ||
                          (tokenURIResponse.isOwner &&
                            tokenURIResponse.minted == "0") ||
                          (tokenURIResponse.minted == "0" &&
                            tokenURIResponse.gated == "1" &&
                            !tokenURIResponse.isPassed)
                        }
                        onClick={async () => {
                          // PUT MINTING CODE HERE
                          if (
                            tokenURIResponse.minted == "0" &&
                            !tokenURIResponse.isOwner
                          ) {
                            if (
                              tokenURIResponse.gated == "0" ||
                              (tokenURIResponse.gated == "1" &&
                                tokenURIResponse.isPassed)
                            ) {
                              setBuyIndex(i + 1);
                              updateFormInput({
                                ...formInput,
                                price: tokenURIResponse.price,
                              });
                              setIsBuy(true);
                              // await mintCollectible(
                              //   tokenURIResponse.collectibleId,
                              //   tokenURIResponse.price
                              // );
                            }
                          } else {
                            // Aspect link (PLEASE UPDATE)
                            window.open(
                              `https://baobab.scope.klaytn.com/account/0x01Ebab7B1D0Ae2064311E7054844CE5c8dB96d96?tabId=txList`,
                              "_blank"
                            );
                          }
                        }}
                        variant="dark"
                      >
                        {/* should also check if the user is elligible to mint, based on gated and milestone */}
                        {isMinting
                          ? "Minting.."
                          : tokenURIResponse.minted == "0"
                          ? tokenURIResponse.gated == "1" &&
                            !tokenURIResponse.isPassed
                            ? "Not Eligible" // &&  !(account.toUpperCase() == addr.toUpperCase())
                            : "Mint"
                          : "Aspect"}
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
