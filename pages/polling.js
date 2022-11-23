import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import ciri_vote_Abi from "../constants/abis/ciri_vote.json";

import { useRouter } from "next/router";
import { Contract, Provider } from "starknet";
import { toHex, toHexString, toFelt } from "starknet/utils/number";

export default function Polling() {
  // To connect to a custom URL:
  const voteAddress = process.env.NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS;
  // let url = process.env.NEXT_PUBLIC_BLOCK_PI;
  // const daoAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;
  // let customHttpProvider = new providers.JsonRpcProvider(url);

  const router = useRouter();

  const ciri_vote_contract = new Contract(
    ciri_vote_Abi,
    voteAddress,
    new Provider({
      sequencer: {
        // baseUrl: "http://localhost:5050",
        network: "goerli-alpha",
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

  // let { addr } = router.query;
  const [message, setMessage] = useState("Empty");
  const [showMessage, setShow] = useState(false);
  useEffect(() => {
    if (router.isReady) {
      const { addr, id } = router.query;
      getData(addr, id);
      const intervalId = setInterval(() => {
        getData(addr, id);
      }, 1000 * 45); // in milliseconds
      return () => clearInterval(intervalId);
    }
  }, [router.isReady]);

  const getData = async (addr, id) => {
    const data = await ciri_vote_contract.get_proposal([toFelt(addr), 0], id);

    console.log(data);

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
        {message != "Empty" && (
          <Row className="h-100">
            <Col className="h-100 justify-content-center border border-white p-3 m-3 shadow-lg">
              {" "}
              <div className="text-center justify-content-center">
                <h1>
                  {message.proposal.executed.toString() == "0"
                    ? "Pollings (Ongoing)"
                    : "Pollings (Executed)"}
                </h1>
                <br />
                <h3>
                  {feltArrToStr([message.proposal.option1]) +
                    " or " +
                    feltArrToStr([message.proposal.option2])}
                </h3>
                <br />
                {message.proposal.executed.toString() == "1" ? (
                  <h3>{`Result : ${feltArrToStr([
                    message.proposal.result,
                  ])}`}</h3>
                ) : (
                  <h3>{`${message.proposal.votesOpt1.toString()} Votes for ${feltArrToStr(
                    [message.proposal.option1]
                  )} vs ${message.proposal.votesOpt2.toString()} Votes for ${feltArrToStr(
                    [message.proposal.option2]
                  )}`}</h3>
                )}
                <br />
              </div>
            </Col>
          </Row>
        )}
      </Container>
    </section>
  );
}
