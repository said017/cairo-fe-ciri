import { Container, Row, Col, ListGroup } from "react-bootstrap";
import Head from "next/head";
// import Sidebar from "../components/Sidebar";
// import MessageForm from "../components/MessageForm";
import { useMoralis, useWeb3Contract, useChain } from "react-moralis";
import { ethers } from "ethers";
import ciri_profile_Abi from "../constants/abis/ciri_profile.json";
import { useEffect, useState } from "react";
import Mint from "../components/Mint";
import Overview from "../components/Overview";
import MilestoneNFT from "../components/MilestoneNFT";
import { PlusCircle } from "react-bootstrap-icons";
import { create as ipfsHttpClient } from "ipfs-http-client";
import Overlays from "../components/Overlays";
import CollectibleNFT from "../components/CollectibleNFT";
import Polling from "../components/Polling";
import { toHex, toHexString, toFelt } from "starknet/utils/number";
import { uint256ToBN } from "starknet/dist/utils/uint256";
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
import { StarknetChainId } from "starknet/constants";

const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

const client = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization,
  },
});

export default function Dashboard() {
  // const { chainId, account, isWeb3Enabled } = useMoralis();
  // const { switchNetwork } = useChain();
  // const chainString = "31337";
  // const { runContractFunction } = useWeb3Contract();
  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  // const [data, setData] = useState([]);
  const [currentPage, setPage] = useState("Overview");
  const [creatorStatus, setCreator] = useState(false);
  const [fileUrl, setFileUrl] = useState(
    "https://ipfs.io/ipfs/QmV1RmdU9TXVztvdBcUPe5v2qfQWL5pfxbrGuipiwUUAJW"
  );
  const [fileUrlFelt, setFileUrlFelt] = useState([]);
  const [nameUrlFelt, setNameUrlFelt] = useState([]);
  const { chain } = useNetwork();
  const [isUploading, setUploading] = useState(false);
  const [isRegistering, setRegistering] = useState(false);
  const [formInput, updateFormInput] = useState({
    name: "",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });
  const [hash, setHash] = useState(undefined);

  const { account, address, status } = useAccount();
  const { library } = useStarknet();

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  function ConvertStringToHex(str) {
    var arr = [];
    for (var i = 0; i < str.length; i++) {
      arr[i] = str.charCodeAt(i).toString(16);
    }
    return arr.join("");
  }

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

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

  async function onUpload(e) {
    const file = e.target.files[0];

    setUploading(true);

    try {
      const added = await client.add(file, {
        progress: (prog) => {},
      });
      const url = `https://ipfs.io/ipfs/${added.path}`;
      setFileUrl(url);
      console.log(strToFeltArr(url));
      setFileUrlFelt(strToFeltArr(url));
    } catch (error) {}
    setUploading(false);
  }

  const {
    data: name,
    loading,
    error,
    refresh,
  } = useStarknetCall({
    contract,
    method: "name",
    args: [],
    options: {
      watch: false,
    },
  });

  const {
    data: balance,
    loading: loadingBalance,
    error: errorBalance,
    refresh: refreshBalance,
  } = useStarknetCall({
    contract,
    method: "balanceOf",
    args: [toFelt(address)],
    options: {
      watch: true,
    },
  });

  const { execute: registerCreator } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "create_profile",
        calldata: [
          parseInt(toFelt("0x" + ConvertStringToHex(formInput.name))),
          fileUrlFelt.length,
          ...fileUrlFelt,
          nameUrlFelt.length,
          ...nameUrlFelt,
        ],
      },
    ],
  });

  const { execute: setCollectibleAddress } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "setCiriAddress",
        calldata: [
          "2366256821942373016249728738264878745410001250966383242796770749056454187431",
        ],
      },
      {
        contractAddress: ciriAddress,
        entrypoint: "setCollectibleAddress",
        calldata: [
          "3123488439330291349219593442130080993199065783282186378195777558217725716181",
        ],
      },
    ],
  });

  function feltToString(felt) {
    const newStrB = Buffer.from(felt.toString(16), "hex");
    return newStrB.toString();
  }

  function felt_to_ascii(str1) {
    var _int = parseInt(str1);
    var hex = _int.toString(16);
    var str = "";
    for (var n = 0; n < hex.length; n += 2) {
      str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
  }

  async function updateUI() {
    // let profile_counter = await ciri_profile.get_profile_counter();
    if (loading) {
      console.log("loading");
    }
    if (error) {
      console.log("error");
    }
    console.log(address);
    console.log(toFelt(address));
    if (name) {
      console.log(felt_to_ascii(name));
    }

    if (balance) {
      console.log(balance);
      console.log(uint256ToBN(balance.balance).toString());
      if (uint256ToBN(balance.balance).toString() == "0") {
        setCreator(false);
      } else {
        console.log("set creator true");
        setCreator(true);
      }
    }

    console.log(library);
  }

  useEffect(() => {
    if (status == "connected") {
      updateUI();
    } else {
      // setCreator(false);
    }
  }, [account, status, loading, error, name, balance]);

  useEffect(() => {
    if (nameUrlFelt.length > 0) {
      registerCreatorCall();
    }
  }, [nameUrlFelt]);

  async function registerCreatorCall() {
    // create the items and list them on the marketplace
    setRegistering(true);

    // we want to create the token
    try {
      await registerCreator().then((tx) => setHash(tx.transaction_hash));
    } catch {
      console.error("Too long waited to mint, go to main page");

      setRegistering(false);
    }
    setNameUrlFelt([]);
    setRegistering(false);
  }

  useEffect(() => {
    if (status == "connected") {
      refreshBalance();
    } else {
      // setCreator(false);
    }
  }, [address, account]);

  useEffect(() => {
    if (
      status == "connected" &&
      receipt &&
      receipt.status == "ACCEPTED_ON_L2"
    ) {
      refreshBalance();
      setHash(undefined);
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  return (
    <section className="dashboard">
      <Head>
        <title>Dashboard</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Container fluid>
        <Row>
          <Col md={3}>
            {/* <button className="underline">Overview</button>
            <button
              className="text-transparent rounded p-4 shadow-lg bg-white"
              onClick={() => {
                updateUI();
              }}
            >
              Update UI
            </button>
            <Mint /> */}
            <span className="navbar-text">
              <button
                onClick={() => {
                  setPage("Overview");
                }}
                className="vvd shadow-lg w-50 mb-3"
              >
                <span>Overview</span>
              </button>
            </span>
            {/* <span className="navbar-text">
              <button
                onClick={() => {
                  setPage("Milestone NFTs");
                }}
                className="vvd shadow-lg w-50 mb-3"
              >
                <span>Milestone NFTs</span>
              </button>
            </span> */}
            <span className="navbar-text">
              <button
                onClick={() => {
                  setPage("Collectible NFTs");
                }}
                className="vvd shadow-lg w-50 mb-3"
              >
                <span>Collectible NFTs</span>
              </button>
            </span>
            <span className="navbar-text">
              <button
                onClick={() => {
                  setPage("Polling");
                }}
                className="vvd shadow-lg w-50 mb-3"
              >
                <span>Polling</span>
              </button>
            </span>
            <span className="navbar-text">
              <button
                onClick={() => {
                  setPage("Overlays");
                  // setCollectibleAddress();
                }}
                className="vvd shadow-lg w-50 mb-3"
              >
                <span>Overlays</span>
              </button>
            </span>
          </Col>
          <Col md={8}>
            {creatorStatus ? (
              currentPage == "Overview" ? (
                <Overview />
              ) : currentPage == "Overlays" ? (
                <Overlays />
              ) : currentPage == "Collectible NFTs" ? (
                <CollectibleNFT />
              ) : currentPage == "Polling" ? (
                <Polling />
              ) : (
                "Coming Soon"
              )
            ) : hash ? (
              <div className="text-center justify-content-center">
                <div>Register tx Hash: {hash}</div>
                {loadingReceipt && <div>Loading...</div>}
                {errorReceipt && (
                  <div>Error: {JSON.stringify(errorReceipt)}</div>
                )}
                {receipt && <div>Status: {receipt.status}</div>}
              </div>
            ) : loadingBalance ? (
              <div className="text-center justify-content-center">
                <div>Checking your profile...</div>
              </div>
            ) : (
              <div className="text-center justify-content-center">
                <br />
                <p className="">
                  You are not Register as Creator, Click the button to register{" "}
                </p>
                <br />
                <div className="signup-profile-pic__container">
                  <img
                    src={fileUrl || "/static/images/cat-img-2.svg"}
                    className="signup-profile-pic"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    <i className="add-picture-icon">
                      {" "}
                      <PlusCircle size={25} />
                    </i>
                  </label>
                  <input
                    disabled={isUploading}
                    type="file"
                    id="image-upload"
                    hidden
                    accept="image/png, image/jpeg"
                    onChange={onUpload}
                  />
                </div>
                <br />
                <div className="justify-content-center">
                  <input
                    placeholder="Your Name"
                    value={formInput.name}
                    className="mt-8 border rounded p-4 w-25"
                    onChange={(e) => {
                      updateFormInput({ ...formInput, name: e.target.value });
                      console.log(ConvertStringToHex(e.target.value));
                    }}
                  />
                  <br />
                  <br />
                </div>
                <span className=" navbar-text justify-content-center">
                  <button
                    // disabled={creatorStatus || isUploading || isRegistering}
                    onClick={async () => {
                      if (!formInput.name || !fileUrl) return;
                      // setRegistering(true);
                      setUploading(true);
                      // await runContractFunction({
                      //   params: {
                      //     abi: milestoneAbi,
                      //     contractAddress: milestoneAddress,
                      //     functionName: "creatorRegister",
                      //     params: {
                      //       _name: `${formInput.name}`,
                      //       _pic: `${fileUrl}`,
                      //     },
                      //   },
                      //   onError: (error) => {},
                      //   onSuccess: async (success) => {
                      //     await success.wait(1);

                      //     setRegistering(false);
                      //     updateUI();
                      //   },
                      // });
                      const data = JSON.stringify({
                        name: formInput.name,
                        //                 "image": "data:image/svg+xml;base64,',
                        // Base64.encode(bytes(finalSvg)),
                        image:
                          "data:image/svg+xml;base64," +
                          btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none">
                        <path fill="url(#B)" d="M1 0h280v270H0z"/>
                          <defs>
                            <filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270">
                              <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/>
                            </filter>
                          </defs>
                        <g transform="translate(15.000000,160.000000) scale(0.100000,-0.100000)"
                      fill="#fff" stroke="none">
                      <path d="M575 1413 c-90 -18 -235 -89 -303 -147 -117 -101 -202 -233 -239
                      -376 -23 -87 -23 -253 0 -340 94 -360 444 -588 807 -526 225 39 414 182 515
                      391 55 113 74 201 70 325 -3 120 -16 172 -70 285 -72 150 -180 258 -330 330
                      -49 23 -112 48 -140 55 -74 18 -230 20 -310 3z m585 -180 c72 -65 27 -183 -70
                      -183 -97 0 -142 118 -70 183 22 20 41 27 70 27 29 0 48 -7 70 -27z m-301 -163
                      c136 -53 240 -168 275 -301 20 -80 14 -208 -14 -282 -41 -108 -148 -215 -257
                      -258 -83 -32 -244 -32 -325 0 -118 46 -218 147 -263 266 -26 66 -14 75 96 75
                      72 0 92 -3 104 -17 9 -10 29 -35 47 -56 46 -57 100 -81 178 -81 129 0 226 89
                      235 216 12 174 -166 302 -327 235 -44 -19 -95 -63 -114 -98 l-15 -29 -109 0
                      c-130 0 -129 -1 -75 107 58 117 180 215 301 241 67 15 205 5 263 -18z"/>
                      </g>
                        <defs>
                          <linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#aa367c"/><stop offset="1" stop-color="#4a2fbd" stop-opacity=".99"/>
                          </linearGradient>
                        </defs>
                        <text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">
                          ${formInput.name}
                        </text>
                      </svg>`),
                      });
                      try {
                        const added = await client.add(data);
                        const url = `https://ipfs.io/ipfs/${added.path}`;
                        console.log("profile nFT");
                        console.log(url);
                        setNameUrlFelt(strToFeltArr(url));
                        // mintCollectible(url, price);
                        // console.log(strToFeltArr(url));
                        // mintCollectible();
                      } catch (error) {}

                      setUploading(false);

                      // await registerCreator().then((tx) =>
                      //   setHash(tx.transaction_hash)
                      // );
                      // setRegistering(false);
                    }}
                  >
                    {isUploading
                      ? "Uploading..."
                      : isRegistering
                      ? "Registering..."
                      : creatorStatus
                      ? "Registered"
                      : "Register"}
                  </button>
                </span>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}
