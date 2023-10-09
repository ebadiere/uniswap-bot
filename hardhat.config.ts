import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: `wss://mainnet.infura.io/ws/v3/6d907a3d92044d448f7a4d69da694a1f`,
      }
    },
    hashio: {
      url: "http://localhost:7546",
      accounts: ['0x7ed189ba10e24b6cf5496ff28b5880187f612e970b17ede9dfa4783780449364'],
      chainId: 0x127,
    },    
  },
};

export default config;
