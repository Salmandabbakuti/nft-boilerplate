import { useState, useEffect } from 'react';
import { Button, TextField } from '@material-ui/core';
import axios from 'axios';
import ipfsClient from "ipfs-http-client";
import { ethers, Contract } from 'ethers';
import Web3Modal from "web3modal";
import ethLogo from './ethLogo.svg';
// import './App.css';
import { abi } from './artifacts/contracts/dMarket.sol/dMarket.json';
import NFTCard from './NFTCard';
import "./Marketplace.scss";

const ipfs = new ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

function App() {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [formInput, setFormInput] = useState({});
  const [logMessage, setLogMessage] = useState('');

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => console.error(err));
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          console.log(`Using account ${accounts[0]}`);
        } else {
          console.error('No accounts found');
        }
      });
      // listen for messages from metamask
      window.ethereum.on('message', (message) => console.log(message));
      // listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        console.log(`Chain changed to ${chainId}`);
        window.location.reload();
      });
      // Subscribe to provider connection
      window.ethereum.on("connect", (info) => {
        console.log('Connected to network:', info);
      });
      // Subscribe to provider disconnection
      window.ethereum.on("disconnect", (error) => {
        console.log('disconnected from network: ', error);
      });
    } else {
      console.error('No ethereum browser detected');
    }
  }, []);
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const { chainId } = await provider.getNetwork();
        console.log('chainId:', chainId);
        const signer = provider.getSigner();
        if (chainId !== 80001) {
          console.error('Wrong network. Please switch to Polygon Mumbai Test network');
          // Switch to Polygon Mumbai Test network
          // if network is not ropsten, try switching to ropsten
          window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13881' }],
          }).catch((err) => {
            console.error(err.message);
            setLogMessage(err.message);
          });
          return
        }
        const contract = new Contract('0x2a0c0073Ee8D651234E1be7Cd7Fb408f9B696cBA', abi, signer);
        setContract(contract);
        const marketItemCount = await contract.getNFTCount();
        const items = [];
        for (let i = 1; i <= parseInt(marketItemCount.toString()); i++) {
          const item = await contract.nfts(i);
          const tokenURI = await contract.tokenURI(i);
          const meta = await axios.get(tokenURI);
          const price = ethers.utils.formatEther(item.price.toString())
          items.push({ ...item, price, meta: meta.data });
        }
        setNfts(items);
        console.log('Market items: ', nfts);
      }
    }
    init().catch((err) => {
      console.error(err)
      setLogMessage(err.message);
    });
  }, []);

  const uploadImageToIPFS = async (e) => {
    console.log("uploading image to IPFS");
    const file = e.target.files[0];
    const { path } = await ipfs.add(file);
    setFormInput({ ...formInput, image: `https://ipfs.io/ipfs/${path}` });
    console.log('file uploaded to ipfs successfully');
  };

  const createMarketItem = async (e) => {
    e.preventDefault();
    if (!['name', 'description', 'image', 'price'].every(key => formInput[key])) {
      alert("Please fill out all fields");
      return;
    };
    const { name, description, image, price } = formInput;
    const priceInWei = ethers.utils.parseEther(price);
    const { path } = await ipfs.add(
      JSON.stringify({
        name,
        description,
        image,
        attributes: []
      })
    );
    setLogMessage('Metadata uploaded to ipfs..');
    const tokenURL = `https://ipfs.io/ipfs/${path}`;
    const createItemTx = await contract.createNFT(tokenURL, priceInWei, { value: ethers.utils.parseEther('0.01') });
    createItemTx.wait().then(() => {
      setLogMessage('Item created successfully');
      window.location.reload();
    });
  };

  const getNfts = async () => {
    const marketItemCount = await contract.getNFTCount();
    const items = [];
    for (let i = 1; i <= marketItemCount.toNumber(); i++) {
      const item = await contract.nfts(i);
      const tokenURI = await contract.tokenURI(i);
      const meta = await axios.get(tokenURI);
      const price = ethers.utils.formatEther(item.price.toString())
      items.push({ ...item, price, meta: meta.data });
    }
    setNfts(items);
    console.log('Market items: ', nfts);
  };

  const handleBuyNft = async (marketItem) => {
    const { price, tokenId } = marketItem;
    console.log(price, tokenId)
    const tx = await contract.buyNFT(tokenId.toString(), {
      value: ethers.utils.parseEther(price.toString())
    });
    tx.wait().then(() => {
      setLogMessage(`Bought item ${marketItem.tokenId} for ${price} ETH`);
    });
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title" style={{ textAlign: "center" }}>dMarket NFT</h1>
        <form onSubmit={(e) => createMarketItem(e)}>
          <h4 style={{ color: 'black', textAlign: 'center' }}>Create Market Item</h4>
          <TextField type="text" name="name" placeholder="Asset Name" onChange={(e) => setFormInput({ ...formInput, name: e.target.value })} />
          <TextField name="description" placeholder="Description" onChange={(e) => setFormInput({ ...formInput, description: e.target.value })} />
          <TextField type='number' name="price" placeholder="Price in Ether" onChange={(e) => setFormInput({ ...formInput, price: e.target.value })} />
          <TextField type="file" name="image" placeholder="Image" onChange={(e) => uploadImageToIPFS(e)} />
          <Button variant="contained" type="submit">Create Item</Button>
        </form>
        <div className="wrapper">
          {nfts.length ? nfts.map((nft) => {
            console.log(nft);
            return (
              <NFTCard
                tokenId={nft.tokenId}
                key={nft.id}
                image={nft.meta.image}
                name={nft.meta.name}
                description={nft.meta.description}
                price={nft.price}
                owner={nft.owner}
                isForSale={nft.isForSale}
                handleBuyNFT={() => handleBuyNft(nft)}
              />
            );
          }) : <div>No items in the Market.!</div>}
        </div>
      </header>
      <p className="App-title">{logMessage}</p>
    </div >
  );
}

export default App;
