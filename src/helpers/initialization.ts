import { ethers } from 'hardhat';
import dotenv from 'dotenv';

import config from '../../config.json';
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import IUniswapV2Factory from '@uniswap/v2-core/build/IUniswapV2Factory.json';

dotenv.config();

let provider;

if (config.PROJECT_SETTINGS.isLocal) {
  provider = new ethers.providers.WebSocketProvider(`ws://127.0.0.1:8545/`);
} else {
  provider = new ethers.providers.WebSocketProvider(`wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
}

// -- SETUP UNISWAP/SUSHISWAP CONTRACTS -- //
const uFactory = new ethers.Contract(config.UNISWAP.FACTORY_ADDRESS, IUniswapV2Factory.abi, provider);
const uRouter = new ethers.Contract(config.UNISWAP.V2_ROUTER_02_ADDRESS, IUniswapV2Router02.abi, provider);
const sFactory = new ethers.Contract(config.SUSHISWAP.FACTORY_ADDRESS, IUniswapV2Factory.abi, provider);
const sRouter = new ethers.Contract(config.SUSHISWAP.V2_ROUTER_02_ADDRESS, IUniswapV2Router02.abi, provider);

const IArbitrage = require('../artifacts/contracts/Arbitrage.sol/Arbitrage.json');
const arbitrage = new ethers.Contract(config.PROJECT_SETTINGS.ARBITRAGE_ADDRESS, IArbitrage.abi, provider);

export {
  provider,
  uFactory,
  uRouter,
  sFactory,
  sRouter,
  arbitrage
};