const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("dMarket Contract Test", () => {
  it("Should return Token Name and Symbol", async () => {
    const contract = await ethers.getContractFactory("dMarket");
    const dmarketContract = await contract.deploy();
    await dmarketContract.deployed();
    expect(await dmarketContract.symbol()).to.equal("DMKT");
    expect(await dmarketContract.name()).to.equal("dMarket");
  });
  it('Should create NFT and return correct token URI', async () => {
    const contract = await ethers.getContractFactory("dMarket");
    const dmarketContract = await contract.deploy();
    await dmarketContract.deployed();
    const createNFTtx = await dmarketContract.createNFT('https://echo.test', '150000', { value: ethers.utils.parseEther('0.01') });
    // wait until the transaction is mined
    await createNFTtx.wait();
    expect(await dmarketContract.tokenURI(1)).to.equal("https://echo.test");
  })
});
