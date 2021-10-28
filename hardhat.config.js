require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("hello", "Prints Hello World", () => console.log("Hello World!"));

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploys Contract", async () => {
  const contract = await ethers.getContractFactory("dMarket");
  const dMarketContract = await contract.deploy();
  await dMarketContract.deployed();
  console.log("dMarket contract deployed to:", dMarketContract.address);
});

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs) => {
    const account = web3.utils.toChecksumAddress(taskArgs.account);
    const balance = await web3.eth.getBalance(account);

    console.log(web3.utils.fromWei(balance, "ether"), "ETH");
  });

module.exports = {
  defaultNetwork: "local",
  networks: {
    hardhat: {
      chainId: 1337
    },
    local: {
      url: "http://127.0.0.1:8545",
    },
    rinkeby: {
      url: "", // rpc providers: infura, alchemy
      accounts: [] // private keys
    },
    ropsten: {
      url: "", // rpc providers: infura, alchemy
      accounts: [] // private keys
    },
    polygonTest: {
      url: "https://rpc-mumbai.maticvigil.com/", // rpc providers: polygon, infura, alchemy
      accounts: []
    },
    polygonMain: {
      url: "https://rpc-mainnet.maticvigil.com", // rpc providers: infura,polygon, alchemy
      accounts: []
    }
  },
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./client/src/artifacts"
  },
  mocha: {
    timeout: 20000
  }
}