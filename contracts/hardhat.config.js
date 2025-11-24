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
        mumbai: {
            url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            gas Gas: 6000000
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
