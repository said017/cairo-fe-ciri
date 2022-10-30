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
import { useMoralis, useWeb3Contract } from "react-moralis";
import { utils } from "ethers";
import Loader from "./Loader";

const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

const client = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization,
  },
});

export default function MilestoneNFT() {
  const [showModal, setShowModal] = useState(false);

  const { chainId, account, isWeb3Enabled } = useMoralis();

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [isMinting, setIsMinting] = useState(false);
  // file to upload
  const [fileUrl, setFileUrl] = useState(null);
  const [isUploading, setUploading] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });

  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const { runContractFunction } = useWeb3Contract();

  const { runContractFunction: getMilestones } = useWeb3Contract({
    abi: milestoneAbi,
    contractAddress: milestoneAddress,
    functionName: "getMilestones",
    params: {
      creator: account,
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

  async function updateMilestones() {
    setIsFetching(true);
    let milestonesData = await getMilestones();

    let dataAfter = [];

    await Promise.all(
      milestonesData.map(async (data) => {
        const tokenURIResponse = await (await fetch(data)).json();

        dataAfter.push(tokenURIResponse);
      })
    );

    setMilestones(dataAfter);
    setIsFetching(false);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateMilestones();
    }
  }, [isWeb3Enabled, account]);

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

  async function createMilestone() {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) return;

    // upload to IPFS
    const data = JSON.stringify({
      name,
      description,
      price,
      image: fileUrl,
    });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.io/ipfs/${added.path}`;

      // run a function that creates sale and passes in the url
      mintMilestone(url, price);
    } catch (error) {}
  }

  async function mintMilestone(url, price) {
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
          functionName: "mintCreatorNFT",
          params: { _tokenURI: url, _price: utils.parseEther(price) },
        },
        onError: (error) => {},
        onSuccess: async (success) => {
          await success.wait(1);
          updateMilestones();
          setIsMinting(false);
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
      <Container fluid>
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
                          {text_truncate(tokenURIResponse.description, 65)}{" "}
                          <br></br> ({tokenURIResponse.price} Klay).
                        </Card.Text>
                        <div>
                          <Button
                            onClick={() =>
                              window.open(
                                `https://testnets.opensea.io/collection/ciriverse-jfodnapiqk`,
                                "_blank"
                              )
                            }
                            variant="primary"
                          >
                            <img
                              src="/static/images/opensea.svg"
                              style={{
                                objectFit: "cover",
                                height: "25px",
                                width: "25px",
                                marginRight: "5px",
                              }}
                            ></img>
                            Open Sea
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
                  <h3>You haven't setup Milestones NFT</h3>
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
            <span>{isMinting ? "Minting..." : "Add Milestones"}</span>
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
          <Modal.Title>Create Milestone NFTs</Modal.Title>
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
            {/* Price and buy start */}
            {/* <div className="mb-1 mt-2">
              <label className="mb-2 font-bold">Sell the NFT</label>
              <div className="text-xs text-gray-700 flex">
                <label className="flex items-center mr-2">
                  <input
                    checked={onSale}
                    onChange={({ target: { checked } }) => {
                      // setOrder({
                      //   ...order,
                      //   price: checked ? order.price : eth.pricePerItem
                      // })
                      setOnSale(checked);
                    }}
                    type="checkbox"
                    className="form-checkbox"
                  />
                </label>
                <span>Tick to sell the NFT</span>
              </div>
            </div> */}
            <input
              //   disabled={!onSale}
              placeholder="Milestone in Klay"
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
              await createMilestone();
              handleCloseModal();
            }}
          >
            {isMinting
              ? "Creating.."
              : isUploading
              ? "Uploading.."
              : "Create Milestone"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
