# ethereum-nft-marketplace
 ethereum nft marketplace

#### Steps:
1. Compile and deploy contract

```shell
npm install
npx hardhat node
npx hardhat compile
npx hardhat deploy (or) npx hardhat run scripts/deployContract.js --network local
npx hardhat test
```
2. Copy deployed contract address and replace contract address in ```client/src/blockchain.js``` with newly deployed address and then run react app in ```client``` directory

```shell
cd client
npm install
npm start
```