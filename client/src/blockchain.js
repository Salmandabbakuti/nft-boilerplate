import { ethers, Contract } from 'ethers';
import Web3Modal from "web3modal"
import { abi } from './artifacts/contracts/dMarket.sol/dMarket.json'

const getContract = async () => {
  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
  });
  const connection = await web3Modal.connect()
  const provider = new ethers.providers.Web3Provider(connection);
  const { chainId } = await provider.getNetwork();
  console.log('chainId:', chainId);
  const signer = provider.getSigner();
  const dMarketContract = new Contract('0xfE54678bC1358f2c30543B0Ae22a35A1C84CB1a4', abi, signer);
  return { dMarketContract };
};

export default getContract;