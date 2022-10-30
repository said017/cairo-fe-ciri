import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CreatorView from "../../components/CreatorView";
import Head from "next/head";
import { useChain } from "react-moralis";

export default function Creator() {
  const router = useRouter();
  const { addr } = router.query;
  const { switchNetwork, chainId } = useChain();

  useEffect(() => {
    if (addr) {
    }
  }, [addr]);

  //   if(loadingState === 'loaded' && meme === {}) return (<h1
  //     className='px-20 py-7 text-4x1'>No NFts in marketplace</h1>)

  return (
    <section className="dashboard">
      <Head>
        <title>Creator</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <div>
        {chainId == "0x3e9" ? (
          <CreatorView address={addr} />
        ) : (
          <span className=" navbar-text justify-content-center">
            <button onClick={() => switchNetwork("0x3e9")}>
              Change to Klaytn Baobab{" "}
            </button>
          </span>
        )}
      </div>
    </section>
  );
}
