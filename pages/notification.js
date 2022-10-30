import { Container, Row, Col, ListGroup } from "react-bootstrap";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import useSound from "use-sound";
let socket;
import { useRouter } from "next/router";

export default function Notification() {
  const router = useRouter();

  // let { addr } = router.query;
  const [play] = useSound("/static/sound/money.mp3");
  const [message, setMessage] = useState("Empty");
  const [showMessage, setShow] = useState(false);
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
  useEffect(() => {
    if (router.isReady) {
      const { addr, mint } = router.query;
      const socketInitializer = async () => {
        socket.on("connect", () => {});

        socket.emit("join-room", `${addr}`);

        if (mint == "true") {
          socket.off("receive-nft").on("receive-nft", (notifMessages) => {
            showNotif(notifMessages);
            play();
          });
          socket.emit("sending-nft", `${addr}`, "Initial Setup NFTs");
        } else {
          socket.off("receive-donate").on("receive-donate", (notifMessages) => {
            showNotif(notifMessages);
            play();
          });
          socket.emit("sending-donate", `${addr}`, "Initial Setup Donate");
        }
      };
      socketInitializer();
    }
  }, [router.isReady]);

  const showNotif = async (notifMessages) => {
    setMessage(notifMessages);
    setShow(true);

    setTimeout(function () {
      setMessage("");
      setShow(false);
    }, 5000);
  };

  return (
    showMessage && (
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
                <br />
                <h1>{message}</h1>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    )
  );
}
