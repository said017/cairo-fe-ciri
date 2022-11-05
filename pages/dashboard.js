import { Container, Row, Col, ListGroup } from "react-bootstrap";
import Head from "next/head";
// import Sidebar from "../components/Sidebar";
// import MessageForm from "../components/MessageForm";
import { useMoralis, useWeb3Contract, useChain } from "react-moralis";
import { ethers } from "ethers";
import ciri_profile_Abi from "../constants/abis/ciri-profile.json";
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
          "1621617476554746761012955328360487266093235295711967375085895067058416810487",
        ],
      },
      {
        contractAddress: ciriAddress,
        entrypoint: "setCollectibleAddress",
        calldata: [
          "158001876634394017517865398725947939774130522959886397164350264160433573443",
        ],
      },
    ],
  });

  // useEffect(() => {
  //   const interval = setInterval(refresh, 5000);
  //   return () => clearInterval(interval);
  // }, [refresh]);

  // const { runContractFunction: seeRegister } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getCreator",
  //   params: {
  //     creator: account,
  //   },
  // });

  // const { runContractFunction: isCreator } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "isCreator",
  //   params: {
  //     _address: account,
  //   },
  // });

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
    if (status == "connected") {
      refreshBalance();
    } else {
      // setCreator(false);
    }
  }, [address, account]);

  useEffect(() => {
    if (status == "connected" && receipt.status == "ACCEPTED_ON_L2") {
      refreshBalance();
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
                      setRegistering(true);
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
                      await registerCreator().then((tx) =>
                        setHash(tx.transaction_hash)
                      );
                      setRegistering(false);
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
