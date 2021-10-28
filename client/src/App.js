import { useState, useEffect } from 'react';
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
    const { name, description, image } = formInput;
    e.preventDefault();
    if (!['name', 'description', 'image', 'price'].every(key => formInput[key])) {
      alert("Please fill out all fields");
      return;
    };
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
    const createItemTx = await dMarketContract.createNFT(tokenURL, formInput.price, { value: ethers.utils.parseEther('0.01') });
    createItemTx.wait().then(() => setLogMessage('Item created successfully'));
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
      < div className="new-market-item" >
        <form onSubmit={(e) => createMarketItem(e)}>
          <input type="text" name="name" placeholder="Asset Name" onChange={(e) => setFormInput({ ...formInput, name: e.target.value })} />
          <textarea name="description" placeholder="Description" onChange={(e) => setFormInput({ ...formInput, description: e.target.value })} />
          <input type='number' name="price" placeholder="Price" onChange={(e) => setFormInput({ ...formInput, price: e.target.value })} />
          <input type="file" name="image" placeholder="Image" onChange={(e) => uploadImageToIPFS(e)} />
          <button type="submit">Create Item</button>
        </form>
      </div >
      {nfts.map((item, i) => (
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
      ))}
      </header>
      <p className="App-title">{logMessage}</p>
    </div >
  );
}

export default App;
