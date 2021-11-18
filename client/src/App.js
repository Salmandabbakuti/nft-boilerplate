import { useState, useEffect } from 'react';
import { Button, TextField } from '@material-ui/core';
import axios from 'axios';
import ipfsClient from "ipfs-http-client";
import { ethers, Contract } from 'ethers';
import Web3Modal from "web3modal";
import ethLogo from './ethLogo.svg';
import './App.css';
import { abi } from './artifacts/contracts/dMarket.sol/dMarket.json';

const ipfs = new ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

function App() {
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [formInput, setFormInput] = useState({});
  const [logMessage, setLogMessage] = useState('');

  const initWeb3 = async () => {
    return new Promise(async (resolve, reject) => {
      const web3Modal = new Web3Modal({
        network: "ropsten",
        cacheProvider: true,
      });
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const { chainId } = await provider.getNetwork();
      console.log('chainId:', chainId);
      if (chainId !== 80001) reject('Wrong network. Please switch to Polygon Mumbai Test network');
      const signer = provider.getSigner();
      const contract = new Contract('0x2a0c0073Ee8D651234E1be7Cd7Fb408f9B696cBA', abi, signer);
      resolve({ contract });
    });
  }

  useEffect(() => {
    initWeb3().then(async ({ contract }) => {
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
    }).catch(err => {
      console.log('err:', err);
      setLogMessage(err);
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
    for (let i = 1; i <= parseInt(marketItemCount.toString()); i++) {
      const item = await contract.nfts(i);
      const tokenURI = await contract.tokenURI(i);
      const meta = await axios.get(tokenURI);
      const price = ethers.utils.formatEther(item.price.toString())
      items.push({ ...item, price, meta: meta.data });
    }
    setNfts(items);
    console.log('Market items: ', nfts);
  };

  const buyNft = async (marketItem) => {
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
        <img src={ethLogo} className="App-logo" alt="logo" />
        <h1 className="App-title">dMarket NFT</h1>
        <form onSubmit={(e) => createMarketItem(e)}>
          <h4 style={{ color: 'black', textAlign: 'center' }}>Create Market Item</h4>
          <TextField type="text" name="name" placeholder="Asset Name" onChange={(e) => setFormInput({ ...formInput, name: e.target.value })} />
          <TextField name="description" placeholder="Description" onChange={(e) => setFormInput({ ...formInput, description: e.target.value })} />
          <TextField type='number' name="price" placeholder="Price in Ether" onChange={(e) => setFormInput({ ...formInput, price: e.target.value })} />
          <TextField type="file" name="image" placeholder="Image" onChange={(e) => uploadImageToIPFS(e)} />
          <Button variant="contained" type="submit">Create Item</Button>
        </form>
        <div className="market-items">
          {nfts.length ? nfts.map((item, i) => (
            <div key={i}>
              <p>ItemId: {item.tokenId.toString()}</p>
              <p>Name: {item.meta.name}</p>
              <img src={item.meta.image} alt={item.meta.name} />
              <p>Description: {item.meta.description}</p>
              <p>Price: {item.price} ETH</p>
              <p>Owner: {item.owner}</p>
              <p>Status: {item.isForSale ? 'For Sale' : 'Not For Sale'}</p>
              {item.isForSale ? <button onClick={() => buyNft(item)}>Buy</button> : ''}
            </div>
          )) :
            <p>No items in the Market.!</p>
          }
        </div>
      </header>
      <p className="App-title">{logMessage}</p>
    </div >
  );
}

export default App;
