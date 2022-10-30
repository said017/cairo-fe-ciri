import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { useEffect, useState } from "react";
let socket;
import { useRouter } from "next/router";
import QRCode from "react-qr-code";

export default function QRLink() {
  const router = useRouter();

  const [addr, setAddr] = useState("");

  useEffect(() => {
    if (router.isReady) {
      const { addr } = router.query;
      setAddr(addr);
    }
  }, [router.isReady]);

  return (
    addr &&
    router.isReady && (
      <section className="notif">
        <Container
          fluid
          style={{
            height: "95vh",
          }}
        >
          <Row className="h-300">
            <Col className="h-300 justify-content-center border border-white p-3 m-3 shadow-lg">
              {" "}
              <div
                style={{
                  height: "auto",
                  margin: "0 auto",
                  maxWidth: 300,
                  width: "100%",
                }}
              >
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={`https://ciriverse.xyz/creator/${addr}`}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    )
  );
}
