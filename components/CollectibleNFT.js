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
import { utils } from "ethers";
import Loader from "./Loader";
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

export default function CollectibleNFT() {
  const [showModal, setShowModal] = useState(false);

  const { account, address, status } = useAccount();

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [isMinting, setIsMinting] = useState(false);
  // file to upload
  const [fileUrl, setFileUrl] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [collectibles, setCollectibles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [tokenLow, setTokenLow] = useState(0);
  const [tokenHigh, setTokenHigh] = useState(0);
  const [hash, setHash] = useState(undefined);

  const [formInput, updateFormInput] = useState({
    name: "",
    price: "0",
    description: "",
    gated: "1",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });
  const [fileUrlFelt, setFileUrlFelt] = useState([]);

  // const calls = useMemo(() => {
  //   const tx = {
  //     contractAddress: ethAddress,
  //     entrypoint: 'transfer',
  //     calldata: [address, 1, 0]
  //   }
  //   return Array(count).fill(tx)
  // }, [address])

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
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
  // const collectibleAddress =
  //   process.env.NEXT_PUBLIC_COLLECTIBLE_CONTRACT_ADDRESS;
  // const { runContractFunction } = useWeb3Contract();

  // const { runContractFunction: getCollectibles } = useWeb3Contract({
  //   abi: collectibleAbi,
  //   contractAddress: collectibleAddress,
  //   functionName: "getCollectibles",
  //   params: {
  //     creator: account,
  //   },
  // });

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  // const {
  //   data: collectible_data,
  //   loading: loadingCollectibles,
  //   error: errorCollectibles,
  //   refresh: refreshCollectibles,
  // } = useStarknetCall({
  //   contract,
  //   method: "get_collectibles",
  //   args: [toFelt(address)],
  //   options: {
  //     watch: false,
  //   },
  // });

  const {
    data: tokenId,
    loading: loadingTokenId,
    error: errorTokenId,
    refresh: refreshTokenId,
  } = useStarknetCall({
    contract,
    method: "tokenOfOwnerByIndex",
    args: [toFelt(address), bnToUint256("0")],
    options: {
      watch: false,
    },
  });

  const { execute: createCollectible } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "create_collectible",
        calldata: [
          tokenLow,
          tokenHigh,
          (parseFloat(formInput.price) * 10 ** 18).toString(),
          0,
          formInput.gated,
          fileUrlFelt.length,
          ...fileUrlFelt,
        ],
      },
    ],
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
    if (tokenId) {
      console.log("TokenID");
      console.log(tokenId);
      const col_counts = await ciri_profile_contract.get_collectibles_count([
        tokenId.tokenId.low.toString(),
        tokenId.tokenId.high.toString(),
      ]);
      if (col_counts > 0) {
        console.log("masuk sini uri col");
        console.log(col_counts);
        for (let i = 0; i < parseInt(col_counts.count.toString()); i++) {
          console.log("masuk sini ga ayah");
          const uri = await ciri_profile_contract.get_collectible_img_id(
            [tokenId.tokenId.low.toString(), tokenId.tokenId.high.toString()],
            // collectible_data.collectible[0].profile_id,
            i + 1
          );
          console.log(uri);

          const tokenURIResponse = await (
            await fetch(feltArrToStr(uri.uri_img))
          ).json();
          dataAfter.push(tokenURIResponse);
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
    console.log(tokenId);
    console.log(loadingTokenId);
    if (tokenId) {
      console.log("TokenId");
      console.log(tokenId.tokenId.low.toString());
      setTokenLow(tokenId.tokenId.low.toString());
      setTokenHigh(tokenId.tokenId.high.toString());
    }
  }

  useEffect(() => {
    if (status === "connected") {
      // refreshCollectibles();
      updateCollectibles();
    }
  }, [status, account, tokenId]);

  useEffect(() => {
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        setFileUrlFelt([]);
        // refreshCollectibles();
        updateCollectibles();
        setIsMinting(false);
        setHash(undefined);
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

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

  async function onUpload(e) {
    const file = e.target.files[0];

    setUploading(true);
    try {
      const added = await client.add(file, {
        progress: (prog) => {},
      });
      const url = `https://ipfs.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {}
    setUploading(false);
  }

  async function createCollectibles() {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) return;

    // upload to IPFS
    console.log("Go here?");
    const data = JSON.stringify({
      name,
      price,
      description,
      image: fileUrl,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.io/ipfs/${added.path}`;
      setFileUrlFelt(strToFeltArr(url));
      // mintCollectible(url, price);
      console.log(strToFeltArr(url));
      // mintCollectible();
    } catch (error) {}
  }

  useEffect(() => {
    if (fileUrlFelt.length > 0) {
      mintCollectible();
    }
  }, [fileUrlFelt]);

  async function mintCollectible() {
    // create the items and list them on the marketplace

    setIsMinting(true);

    // we want to create the token
    try {
      await createCollectible().then((tx) => {
        setHash(tx.transaction_hash);
      });
      // transaction = await contract.makeMarketItem(nftaddress, tokenId, price, {value: listingPrice})
      // await transaction.wait()
      // runContractFunction({
      //   params: {
      //     abi: collectibleAbi,
      //     contractAddress: collectibleAddress,
      //     functionName: "addCollectible",
      //     params: { _URI: url, price: utils.parseEther(price) },
      //   },
      //   onError: (error) => {},
      //   onSuccess: async (success) => {
      //     await success.wait(1);
      //     updateCollectibles();
      //     setIsMinting(false);
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
      <Container fluid>
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
                          <br></br> ({tokenURIResponse.price} ETH).
                        </Card.Text>
                        <div>
                          <Button
                            onClick={() =>
                              window.open(
                                `https://baobab.scope.klaytn.com/account/0x01Ebab7B1D0Ae2064311E7054844CE5c8dB96d96?tabId=txList`,
                                "_blank"
                              )
                            }
                            variant="dark"
                          >
                            <img
                              src="/static/images/aspect-word-white.png"
                              style={{
                                objectFit: "cover",
                                height: "25px",
                                width: "75px",
                                marginRight: "5px",
                              }}
                            ></img>
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
                  <h3>You haven't setup Collectible NFT</h3>
                  <br />
                </div>
              )}
            </Row>
          </Col>
        </Row>
        <span className="navbar-text">
          <button
            disabled={isMinting || loadingTokenId}
            onClick={() => {
              handleShowModal();
            }}
            className="vvd shadow-lg"
          >
            <span>
              {isMinting
                ? "Minting..."
                : loadingTokenId
                ? "Loading..."
                : "Add Collectibles"}
            </span>
          </button>
        </span>
      </Container>

      <Modal
        style={{ zIndex: "9999" }}
        show={showModal}
        onHide={handleCloseModal}
        className="text-black"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Collectible NFTs</Modal.Title>
        </Modal.Header>
        <Modal.Body className="justify-content-center">
          <div className="justify-content-center ">
            <input
              placeholder="Asset Name"
              value={formInput.name}
              className="mt-8 border rounded p-4 w-100"
              onChange={(e) =>
                updateFormInput({ ...formInput, name: e.target.value })
              }
            />
            <br />
            <textarea
              placeholder="Asset Description"
              className="mt-2 border rounded p-4 w-100"
              value={formInput.description}
              onChange={(e) => {
                updateFormInput({ ...formInput, description: e.target.value });
              }}
            />
            <br />
            <div className="text-xs text-gray-700 flex">
              <label className="flex items-center p-2">
                <input
                  checked={formInput.gated == "1"}
                  onChange={({ target: { checked } }) => {
                    if (checked) {
                      updateFormInput({ ...formInput, gated: "1" });
                    } else {
                      updateFormInput({ ...formInput, gated: "0" });
                    }
                    console.log("checked " + checked);
                  }}
                  type="checkbox"
                  className="form-checkbox"
                />
              </label>
              <span>Tick to sell Gate with Milestone</span>
            </div>
            <input
              //   disabled={!onSale}
              placeholder="Price in ETH"
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
            {/* Category Start */}
            {/* Category End */}
            {/* Tags Start */}
            {/*  implementation later  */}
            {/* Tags End */}
            <input
              type="file"
              name="Asset"
              className="mt-4"
              onChange={onUpload}
            />{" "}
            <br />
            {fileUrl && (
              <img className="rounded mt-4" width="350px" src={fileUrl} />
            )}
            <br />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            disabled={isMinting || isUploading}
            variant="primary"
            onClick={async () => {
              await createCollectibles();
              handleCloseModal();
            }}
          >
            {isMinting
              ? "Creating.."
              : isUploading
              ? "Uploading.."
              : "Create Collectible"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
