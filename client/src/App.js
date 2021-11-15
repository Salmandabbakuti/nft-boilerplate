import { useState, useEffect } from 'react';
import { Button, TextField } from '@material-ui/core';
import axios from 'axios';
import ipfsClient from "ipfs-http-client";
import { ethers } from 'ethers';
import ethLogo from './ethLogo.svg'
import './App.css';
import getContract from './blockchain';

const ipfs = new ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

function App() {
  const [nfts, setNfts] = useState([]);
  const [formInput, setFormInput] = useState({});
  const [logMessage, setLogMessage] = useState('');

  useEffect(() => {
    getNfts();
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
    const { dMarketContract } = await getContract();
    const createItemTx = await dMarketContract.createNFT(tokenURL, priceInWei, { value: ethers.utils.parseEther('0.01') });
    createItemTx.wait().then(() => {
      setLogMessage('Item created successfully');
      window.location.reload();
    });
  };

  const getNfts = async () => {
    const { dMarketContract } = await getContract();
    const marketItemCount = await dMarketContract.getNFTCount();
    const items = [];
    for (let i = 1; i <= parseInt(marketItemCount.toString()); i++) {
      const item = await dMarketContract.nfts(i);
      const tokenURI = await dMarketContract.tokenURI(i);
      const meta = await axios.get(tokenURI);
      const price = ethers.utils.formatEther(item.price.toString())
      items.push({ ...item, price, meta: meta.data });
    }
    setNfts(items);
    console.log('Market items: ', nfts);
  };
  const buyNft = async (marketItem) => {
    const { dMarketContract } = await getContract();
    const { price, tokenId } = marketItem;
    console.log(price, tokenId)
    const tx = await dMarketContract.buyNFT(tokenId.toString(), {
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
