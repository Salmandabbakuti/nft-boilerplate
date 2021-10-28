async function main() {
  const contract = await ethers.getContractFactory("dMarket");
  const dMarketContract = await contract.deploy();
  await dMarketContract.deployed();
  return dMarketContract;
}

main()
  .then(async (contract) => {
    console.log('dMarketContract deployed at: ', contract.address);
  })
  .catch((error) => {
    console.error('failed to deploy dMarketContract', error);
  });
