import Head from "next/head";
import Image from "next/image";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import WhyCiri from "../components/WhyCiri";
import { useMoralis } from "react-moralis";

// moralis hook declaration

export default function Home() {
  return (
    <div>
      <Head>
        <title>Ciriverse</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <Hero />
      <HowItWorks />
      <WhyCiri />
      <Footer />
    </div>
  );
}
