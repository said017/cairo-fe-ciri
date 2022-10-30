import { Container, Row, Col, Tab, Nav } from "react-bootstrap";

import "animate.css";
import TrackVisibility from "react-on-screen";
import { useState } from "react";
import { create as ipfsHttpClient } from "ipfs-http-client";
import milestoneMgmtAbi from "../constants/MilestoneNFTv2.json";
import { useMoralis, useWeb3Contract } from "react-moralis";

const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET;
const authorization = "Basic " + btoa(projectId + ":" + projectSecret);

const client = ipfsHttpClient({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization,
  },
});

export default function Mint() {
  const [onSale, setOnSale] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  // file to upload
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
    category: "Funny",
    // tags: [
    //   { id: 'NFT', text: 'NFT' },
    //   { id: 'Chiq', text: 'Chiq' },
    // ]
  });

  const milestoneAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const { runContractFunction } = useWeb3Contract();

  async function onUpload(e) {
    const file = e.target.files[0];

    try {
      const added = await client.add(file, {
        progress: (prog) => {},
      });
      const url = `https://infura-ipfs.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {}
  }

  return (
    <section>
      <div>
        <div>
          <input
            placeholder="Asset Name"
            value={formInput.name}
            className="mt-8 border rounded p-4"
            onChange={(e) =>
              updateFormInput({ ...formInput, name: e.target.value })
            }
          />
          <textarea
            placeholder="Asset Description"
            className="mt-2 border rounded p-4"
            value={formInput.description}
            onChange={(e) => {
              updateFormInput({ ...formInput, description: e.target.value });
            }}
          />
          {/* Price and buy start */}
          <div className="mb-1 mt-2">
            <label className="mb-2 font-bold">Sell the NFT</label>
            <div className="text-xs text-gray-700 flex">
              <label className="flex items-center mr-2">
                <input
                  checked={onSale}
                  onChange={({ target: { checked } }) => {
                    // setOrder({
                    //   ...order,
                    //   price: checked ? order.price : eth.pricePerItem
                    // })
                    setOnSale(checked);
                  }}
                  type="checkbox"
                  className="form-checkbox"
                />
              </label>
              <span>Tick to sell the NFT</span>
            </div>
          </div>
          <input
            disabled={!onSale}
            placeholder="Asset Price in Eth"
            className="mt-2 border rounded p-4"
            type="text"
            name="price"
            value={formInput.price}
            onChange={(e) => {
              if (isNaN(e.target.value)) {
                return;
              }
              updateFormInput({ ...formInput, price: e.target.value });
            }}
          />
          {/* Category Start */}
          <div className="mt-2 relative text-gray-700">
            Category :
            <select
              className="ml-4 w-72 h-10 pl-3 pr-6 text-base placeholder-gray-600 border rounded-lg appearance-none focus:shadow-outline"
              placeholder="Regular input"
              onChange={(e) => {
                updateFormInput({ ...formInput, category: e.target.value });
              }}
              value={formInput.category}
            >
              <option value="Funny">Funny</option>
              <option value="Anime">Anime</option>
              <option value="Blockchain">Blockchain</option>
              <option value="Cat">Cat</option>
              <option value="Chiq">Chiq</option>
            </select>
          </div>
          {/* Category End */}
          {/* Tags Start */}
          {/*  implementation later  */}
          {/* Tags End */}
          <input
            type="file"
            name="Asset"
            className="mt-4"
            onChange={onUpload}
          />{" "}
          {fileUrl && (
            <img className="rounded mt-4" width="350px" src={fileUrl} />
          )}
          <button
            // disabled={!canPurchaseMeme || isMinting === true}
            onClick={() => {
              runContractFunction({
                params: {
                  abi: milestoneMgmtAbi,
                  contractAddress: milestoneAddress,
                  functionName: "mintCreatorNFT",
                  params: { _tokenURI: fileUrl, _price: 10000 },
                },
                onError: (error) => {},
                onSuccess: (success) => {
                  //   updateUI();
                },
              });
            }}
            className="font-bold mt-4 bg-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded p-4 shadow-lg"
          >
            {isMinting ? (
              <div className="w-full flex justify-center m-1">
                {/* <Loader /> */}
              </div>
            ) : (
              <div className="m-1">Mint Meme</div>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
