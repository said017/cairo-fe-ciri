import { Container, Row, Col, Tab, Nav, Card, Button } from "react-bootstrap";

import "animate.css";

import { create as ipfsHttpClient } from "ipfs-http-client";

import { useMoralis, useWeb3Contract } from "react-moralis";
import milestoneAbi from "../constants/MilestoneNFTv2.json";
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

export default function Users() {
  const { account, address, status } = useAccount();
  // const [funds, setFunds] = useState("0");
  // const [donatorsCount, setdonatorsCount] = useState("0");
  const [profiles, setProfiles] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

  const ciriAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  // const { runContractFunction: getFunds } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getFunds",
  //   params: {
  //     creator: account,
  //   },
  // });

  // const { runContractFunction: getDonatorsCount } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: milestoneAddress,
  //   functionName: "getDonatorsCount",
  //   params: {
  //     creator: account,
  //   },
  // });

  // const { runContractFunction: getCreators } = useWeb3Contract({
  //   abi: milestoneAbi,
  //   contractAddress: ciriAddress,
  //   functionName: "getCreators",
  // });

  // async function updateFunds() {
  //   let fundsData = await getFunds();
  //   fundsData = utils.formatUnits(fundsData, "ether");

  //   setFunds(fundsData);
  // }

  // async function updateDonatorsCount() {
  //   let donatorsData = await getDonatorsCount();
  //   donatorsData = utils.formatEther(donatorsData);
  //   setdonatorsCount(donatorsData);
  // }
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

  const { contract } = useContract({
    address: ciriAddress,
    abi: ciri_profile_Abi,
  });

  const {
    data: num,
    loading: loadingNum,
    error: errorNum,
    refresh: refreshNum,
  } = useStarknetCall({
    contract,
    method: "get_profile_counter",
    args: [],
    options: {
      watch: true,
    },
  });

  async function updateCreators() {
    // setIsFetching(true);
    // let creatorsData = await getCreators();
    console.log("masuk sini ga ya");

    // setMilestones(creatorsData);
    // setIsFetching(false);
    setIsFetching(true);
    // let num = await getNumProposals();

    let dataAfter = [];

    if (num) {
      console.log(num.number);
      console.log(uint256ToBN(num.number).toString());
      for (let i = 0; i < parseInt(uint256ToBN(num.number).toString()); i++) {
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
        const data = await ciri_profile_contract.get_profile_by_id(
          bnToUint256(i + 1)
        );
        const pic = await ciri_profile_contract.get_profile_img_id(
          bnToUint256(i + 1)
        );
        const img_url = feltArrToStr(pic.uri_img);
        console.log("data nya");
        console.log(data);
        console.log("PIC");
        console.log(pic);
        dataAfter.push({ ...data, pic: img_url });
      }
      console.log(dataAfter);
      setProfiles(dataAfter);
    }

    setIsFetching(false);
  }

  useEffect(() => {
    if (status == "connected") {
      // updateFunds();
      // updateDonatorsCount();
      refreshNum();
      updateCreators();
    }
  }, [status, account]);

  useEffect(() => {
    if (status == "connected") {
      // updateFunds();
      // updateDonatorsCount();
      // refreshNum();
      updateCreators();
    }
  }, [num]);

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
        <Row className="text-center">
          <Col
            style={{
              background:
                "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
            }}
            className="p-3 m-3 shadow-md"
          >
            <h4>Creators</h4>
            <Row className="p-4 justify-content-center text-white">
              {isFetching ? (
                <div className="justify-content-center">
                  <Loader />
                </div>
              ) : profiles.length > 0 ? (
                profiles.map((user, i) => {
                  console.log("ada user ga sih");
                  console.log(user);
                  return (
                    <Card
                      key={i}
                      onClick={() => {
                        router.push(
                          `/creator/${uint256ToBN(user.creator_id).toString()}`
                        );
                      }}
                      className="m-3 justify-content-center shadow-lg border border-white"
                      style={{
                        width: "18rem",
                        background:
                          "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
                      }}
                    >
                      <div className="pt-4 justify-content-center">
                        <Card.Img
                          style={{
                            objectFit: "cover",
                            height: "300px",
                            width: "15rem",
                          }}
                          src={user.pic}
                        />
                      </div>

                      <Card.Body>
                        <Card.Title>
                          {text_truncate(feltArrToStr([user.name]), 15)}
                        </Card.Title>
                        <Card.Text
                          style={{
                            height: "75px",
                          }}
                        >
                          {text_truncate(feltArrToStr([user.name]), 15)}
                        </Card.Text>{" "}
                        <div>
                          <Button
                            onClick={() => {
                              router.push(
                                `/creator/${uint256ToBN(
                                  user.creator_id
                                ).toString()}`
                              );
                            }}
                            variant="primary"
                          >
                            View
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
                  <h3>No Creator in Ciri</h3>
                  <br />
                </div>
              )}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
