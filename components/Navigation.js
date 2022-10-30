import React from "react";
import { useState, useEffect } from "react";
import {
  Nav,
  Navbar,
  Container,
  Button,
  NavDropdown,
  Modal,
} from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";

// import { useSignMessage } from "wagmi";
// moralis
// import { useMoralis, useChain } from "react-moralis";
import Link from "next/link";
import { useAccount, useConnectors } from "@starknet-react/core";
import { useRouter } from "next/router";
import axios from "axios";

export default function Navigation() {
  const [activeLink, setActiveLink] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);
  // const { signMessageAsync } = useSignMessage();

  // moralis hook declaration
  // const {
  //   enableWeb3,
  //   isWeb3Enabled,
  //   isWeb3EnableLoading,
  //   account,
  //   Moralis,
  //   chainId,
  //   deactivateWeb3,
  // } = useMoralis();
  const { account, address, status } = useAccount();
  const { available, refresh, connect, connectors, disconnect } =
    useConnectors();

  // const { switchNetwork } = useChain();

  useEffect(() => {
    if (
      status === "disconnected" &&
      typeof window !== "undefined" &&
      window.localStorage.getItem("connected")
    ) {
      // connect(window.localStorage.getItem("connected"));
      console.log("inside here 1");
      console.log(window.localStorage.getItem("connected"));
      for (let i = 0; i < connectors.length; i++) {
        console.log(connectors[i]);
        if (connectors[i].id() == window.localStorage.getItem("connected")) {
          console.log("inside here 2");
          connect(connectors[i]);
        }
      }

      // enableWeb3({provider: window.localStorage.getItem("connected")}) // add walletconnect
    }
  }, [status]);

  // useEffect(() => {
  //   Moralis.onAccountChanged((account) => {
  //     if (account == null) {
  //       window.localStorage.removeItem("connected");
  //       deactivateWeb3();
  //     }
  //   });
  // }, []);

  // useEffect(() => {
  //   if (account) {
  //     // if (chainId != "0x3e9") {
  //     //   switchNetwork("0x3e9");
  //     // }
  //     const connectToMoralis = async () => {
  //       const userData = {
  //         address: account,
  //         chain: chainId,
  //         network: "evm",
  //       };
  //     };
  //     connectToMoralis();
  //   }
  // }, [account, chainId]);

  useEffect(() => {
    if (account) {
      console.log("account changed");
    }
    // if (account == null) {
    //   window.localStorage.removeItem("connected");
    //   // disconnect();
    // }
  }, [account]);

  async function handleLogout(e) {
    e.preventDefault();
    //   await logoutUser(user);
    // redirect to home page
    window.location.replace("/");
  }

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const onUpdateActiveLink = (value) => {
    setActiveLink(value);

    if (value.length) {
      const element = document.getElementById(value.substring(1));
      if (element) {
        element.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    }
  };

  return (
    <Navbar expand="md" className={scrolled ? "scrolled" : ""}>
      <Container>
        <Link href="/#">
          <a className="navbar-brand">
            <Navbar.Brand
              // className="test"
              onClick={() => onUpdateActiveLink("#")}
            >
              <img
                src="/static/images/logo-ciri-white-nobg.png"
                alt="Logo"
                style={{ width: 50, height: 50, marginRight: 10 }}
              />{" "}
              Ciriverse
            </Navbar.Brand>
          </a>
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav">
          <span className="navbar-toggler-icon"> </span>
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {!account && (
              <>
                <Link href="#how-it-works">
                  <a
                    className={
                      activeLink === "#how-it-works"
                        ? "active nav-link navbar-link"
                        : "nav-link navbar-link"
                    }
                    onClick={() => onUpdateActiveLink("#how-it-works")}
                  >
                    How It Works
                  </a>
                </Link>

                <Link href="#why-ciri">
                  <a
                    className={
                      activeLink === "#why-ciri"
                        ? "active nav-link navbar-link"
                        : "nav-link navbar-link"
                    }
                    onClick={() => onUpdateActiveLink("#why-ciri")}
                  >
                    Why Ciri
                  </a>
                </Link>
              </>
            )}
            {account && (
              <>
                <Link href="/dashboard">
                  <a
                    className={
                      activeLink === "dashboard"
                        ? "active nav-link navbar-link"
                        : "nav-link navbar-link"
                    }
                    onClick={() => onUpdateActiveLink("dashboard")}
                  >
                    Dashboard
                  </a>
                </Link>

                <Link href="/explore">
                  <a
                    className={
                      activeLink === "explore"
                        ? "active nav-link navbar-link"
                        : "nav-link navbar-link"
                    }
                    onClick={() => onUpdateActiveLink("explore")}
                  >
                    Explore
                  </a>
                </Link>
              </>
            )}
            <span className="navbar-text">
              {/* <div className="social-icon">
                  <a href="#"><img src={navIcon1} alt="" /></a>
                  <a href="#"><img src={navIcon2} alt="" /></a>
                  <a href="#"><img src={navIcon3} alt="" /></a>
                </div> */}

              <button
                className="vvd"
                onClick={async () => {
                  handleShowModal();
                }}
                disabled={status === "connected"}
              >
                {status === "disconnected"
                  ? "Connect"
                  : `${address.slice(0, 6)}...
                              ${address.slice(address.length - 4)}`}
                {/* <span>
                  {account
                    ? `${account.slice(0, 6)}...
                              ${account.slice(account.length - 4)}`
                    : isWeb3EnableLoading
                    ? `Connecting..`
                    : `Let’s Connect`}
                </span> */}
              </button>
            </span>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <Modal
        // style={{ zIndex: "9999" }}
        show={showModal}
        onHide={handleCloseModal}
        style={{
          background:
            "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
          zIndex: "9999",
        }}
        className="border border-white p-3 m-3 shadow-lg"
      >
        <Modal.Header
          style={{
            background:
              "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
            // zIndex: "9999",
          }}
          closeButton
        >
          <Modal.Title>Connect Wallet</Modal.Title>
        </Modal.Header>
        <Modal.Footer
          style={{
            background:
              "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
            // zIndex: "9999",
          }}
          className="justify-content-center"
        >
          {connectors.map((connector) => (
            <Button
              key={connector.id()}
              style={{
                background:
                  "linear-gradient(90.21deg,rgba(170, 54, 124, 0.5) -5.91%,rgba(74, 47, 189, 0.5) 111.58%)",
                // zIndex: "9999",
              }}
              className="border border-white p-3 m-3"
              onClick={() => {
                connect(connector);

                // depends on what button they picked
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("connected", `${connector.id()}`);
                  // window.localStorage.setItem("connected", "walletconnect")
                }

                console.log(connect);
                handleCloseModal();
              }}
            >
              Connect {connector.id()}
            </Button>
          ))}
          {/* <Button
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
          </Button> */}
        </Modal.Footer>
      </Modal>
    </Navbar>
  );
}
