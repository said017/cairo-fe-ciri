import { Container, Row, Col, Tab, Nav } from "react-bootstrap";

import "animate.css";
import TrackVisibility from "react-on-screen";

export default function WhyCiri() {
  return (
    <section className="why" id="why-ciri">
      <Container>
        <Row>
          <Col size={12}>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__fadeIn" : ""
                  }
                >
                  <h2>Why Ciriverse?</h2>
                  <br></br>
                  {/* <p>
                        Easy to use, decentralized platform. The NFTs and platform
                        can be integrated to Web3 and Web2 platform (Youtube, Twitch
                        etc.)
                      </p> */}
                  <Tab.Container id="whys-tabs" defaultActiveKey="first">
                    <Nav
                      variant="pills"
                      className="nav-pills mb-5 justify-content-center align-items-center"
                      id="pills-tab"
                    >
                      <Nav.Item>
                        <Nav.Link eventKey="first">Easy NFTs Setup</Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="second">
                          Immersive Interaction
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="third">Integration</Nav.Link>
                      </Nav.Item>
                    </Nav>
                    <Tab.Content
                      id="slideInUp"
                      className={
                        isVisible ? "animate__animated animate__slideInUp" : ""
                      }
                    >
                      <Tab.Pane eventKey="first">
                        <p>
                          Simple account creation and NFTs setup (No Code!).
                          Just provide the art and Ciriverse, powered by Klaytn
                          will take care the rest.
                        </p>
                      </Tab.Pane>
                      <Tab.Pane eventKey="second">
                        <p>
                          With NFTs gated setup, you can provide exclusive
                          access to your audience like chat room, videos and let
                          your audience involve in your content using Ciriverse
                          voting system.
                        </p>
                      </Tab.Pane>
                      <Tab.Pane eventKey="third">
                        <p>
                          Easy to use, decentralized platform. The NFTs and
                          platform can be integrated to Web3 (OpenSea etc.) and
                          Web2 platform (Youtube, Twitch etc).
                        </p>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </div>
              )}
            </TrackVisibility>
          </Col>
        </Row>
      </Container>
      {/* <img className="background-image-right" src={colorSharp2}></img> */}
    </section>
  );
}
