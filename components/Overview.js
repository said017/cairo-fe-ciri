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
// import {
//   Container,
//   Row,
//   Col,
//   Tab,
//   Card,
//   Button,
//   Modal,
//   Form,
// } from "react-bootstrap";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import Loader from "./Loader";
import ciri_profile_Abi from "../constants/abis/ciri_profile.json";
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

export default function Overview() {
  const { account, address, status } = useAccount();
  const [funds, setFunds] = useState("0");
  const [donatorsCount, setdonatorsCount] = useState("0");
  const [milestones, setMilestones] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isWithdrawing, setWithdrawing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const [hash, setHash] = useState(undefined);

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const [formInput, updateFormInput] = useState({
    price: "",
  });

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const {
    data: receipt,
    loading: loadingReceipt,
    error: errorReceipt,
  } = useTransactionReceipt({ hash, watch: true });

  const {
    data: profiles,
    loading: loadingProfile,
    error: errorProfile,
    refresh: refreshBalance,
  } = useStarknetCall({
    contract,
    method: "get_profile_by_addr",
    args: [toFelt(address)],
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
    method: "get_donators_count",
    args: [toFelt(address)],
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
    method: "get_profile_milestone_by_addr",
    args: [toFelt(address)],
    options: {
      watch: true,
    },
  });

  const { execute: updateMilestone } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "set_creator_milestone_by_addr",
        calldata: [
          toFelt(address),
          (parseFloat(formInput.price) * 10 ** 18).toString(),
        ],
      },
    ],
  });

  const { execute: withdraw_fund } = useStarknetExecute({
    calls: [
      {
        contractAddress: ciriAddress,
        entrypoint: "withdraw",
        calldata: [],
      },
    ],
  });

  useEffect(() => {
    if (status == "connected") {
      if (receipt && receipt.status == "ACCEPTED_ON_L2") {
        setIsUpdating(false);
        setWithdrawing(false);
        refreshMilestone();
      }
    } else {
      // setCreator(false);
    }
  }, [receipt]);

  async function updateFunds() {
    // let fundsData = await getFunds();
    // fundsData = utils.formatUnits(fundsData, "ether");

    // setFunds(fundsData);
    console.log("logging profiles");
    console.log(profiles);
    console.log("logging count");
    console.log(donators_count);
    console.log("loggin_milestone");
    console.log(milestone);
  }

  useEffect(() => {
    if (status === "connected") {
      updateFunds();
      // updateDonatorsCount();
      // updateMilestones();
    }
  }, [status, account, profiles, donators_count, milestone]);

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
    <section>
      <Container fluid>
        {profiles && (
          <Row className="text-center">
            <Col
              style={{
                background:
                  "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
              }}
              className="border border-white p-3 m-3 shadow-lg"
            >
              <h4 className="pb-2">Withdraw</h4>
              <h2 className="pb-2">
                {(uint256ToBN(profiles.funds) / 10 ** 18).toString()} ETH
              </h2>
              <span className=" navbar-text justify-content-center">
                <button
                  disabled={isWithdrawing}
                  onClick={async () => {
                    setWithdrawing(true);
                    withdraw_fund().then((tx) => setHash(tx.transaction_hash));
                  }}
                  className="vvd shadow-md"
                >
                  <span>{isWithdrawing ? "Withdrawing.." : "Withdraw"}</span>
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
              <h4 className="pb-3">Total Supporters</h4>
              <h2>{donators_count && donators_count.toString()}</h2>
              <h3>Supportes</h3>
            </Col>
          </Row>
        )}
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
              {!milestone ? (
                <div className="justify-content-center text-white">
                  <Loader />
                </div>
              ) : milestone.toString() != "0" ? (
                <h2 className="text-white">
                  {parseFloat(uint256ToBN(milestone.milestone).toString()) /
                    10 ** 18 +
                    " ETH"}
                </h2>
              ) : (
                <div className="text-white">
                  <img
                    className="w-50"
                    src="/static/images/cat-img-2.svg"
                  ></img>
                  <h3>You haven't setup Milestone Donation</h3>
                  <br />
                </div>
              )}
            </Row>
          </Col>
        </Row>
        <span className="navbar-text">
          <button
            disabled={isUpdating}
            onClick={() => {
              handleShowModal();
            }}
            className="vvd shadow-lg"
          >
            <span>{isUpdating ? "Updating.." : "Update Milestone"}</span>
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
          <Modal.Title>Update Milestone in ETH</Modal.Title>
        </Modal.Header>
        <Modal.Body className="justify-content-center">
          <div className="justify-content-center ">
            <br />
            <input
              //   disabled={!onSale}
              placeholder="Milestone in ETH"
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
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button
            disabled={isUpdating}
            variant="primary"
            onClick={async () => {
              setIsUpdating(true);
              await updateMilestone().then((tx) => {
                setHash(tx.transaction_hash);
              });
              handleCloseModal();
            }}
          >
            {isUpdating ? "Updating" : "Update Milestone"}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
