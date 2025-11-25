require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            chainId: 1337
        },
        amoy: {
            url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gas: 6000000,
            chainId: 80002
        },
        polygon: {
            url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gasPrice: 50000000000 // 50 gwei
        }
    },
    etherscan: {
        apiKey: {
            polygon: process.env.POLYGONSCAN_API_KEY || "",
            polygonMumbai: process.env.POLYGONSCAN_API_KEY || ""
        }
    },
    paths: {
        sources: "./",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
