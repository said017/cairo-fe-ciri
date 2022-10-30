import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { Contract, providers } from "ethers";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import daoAbi from "../constants/CiriverseDAO.json";

import { useRouter } from "next/router";

export default function Polling() {
  // To connect to a custom URL:
  let url = process.env.NEXT_PUBLIC_BLOCK_PI;
  const daoAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;
  let customHttpProvider = new providers.JsonRpcProvider(url);

  const router = useRouter();

  // let { addr } = router.query;
  const [message, setMessage] = useState("Empty");
  const [showMessage, setShow] = useState(false);
  useEffect(() => {
    if (router.isReady) {
      const { addr, id } = router.query;
      const daoContract = getDaoContractInstance(customHttpProvider);
      getData(daoContract, addr, id);
      const intervalId = setInterval(() => {
        getData(daoContract, addr, id);
      }, 1000 * 45); // in milliseconds
      return () => clearInterval(intervalId);
    }
  }, [router.isReady, customHttpProvider.networkOrReady]);

  // Helper function to return a DAO Contract instance
  // given a Provider/Signer
  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(daoAddress, daoAbi, providerOrSigner);
  };

  const getData = async (daoContract, addr, id) => {
    // let network = await customHttpProvider.getNetwork();

    const num = await daoContract.getNumProposals(addr);
    const data = await daoContract.s_proposals(addr, id);

    setMessage(data);
  };

  return (
    <section className="notif">
      <Container
        fluid
        style={{
          height: "95vh",
        }}
      >
        <Row className="h-100">
          <Col className="h-100 justify-content-center border border-white p-3 m-3 shadow-lg">
            {" "}
            <div className="text-center justify-content-center">
              <h1>{"Pollings" + message[5] ? "(Finished)" : "(Executed)"}</h1>
              <br />
              <h3>{message[1] + " or " + message[2]}</h3>
              <br />
              {message[5] ? (
                <h3>{`Result : ${message[6]}`}</h3>
              ) : (
                <h3>{`${message[3]} Votes for ${message[1]} vs ${message[4]} Votes for ${message[2]}`}</h3>
              )}
              <br />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
