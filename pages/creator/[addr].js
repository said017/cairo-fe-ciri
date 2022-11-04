import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CreatorView from "../../components/CreatorView";
import Head from "next/head";
import { useChain } from "react-moralis";

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

export default function Creator() {
  const { account, address, status } = useAccount();
  const router = useRouter();
  const { addr } = router.query;
  // const { switchNetwork, chainId } = useChain();

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
        {status == "connected" ? (
          <CreatorView addrs={addr} />
        ) : (
          <span className=" navbar-text justify-content-center">
            Oopss..something is wrong
          </span>
        )}
      </div>
    </section>
  );
}
