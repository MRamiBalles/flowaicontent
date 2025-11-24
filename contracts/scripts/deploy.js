const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying FloToken with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // Deploy FloToken
    const FloToken = await hre.ethers.getContractFactory("FloToken");
    const token = await FloToken.deploy(deployer.address);

    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();

    console.log("\n✅ FloToken deployed successfully!");
    console.log("📍 Contract Address:", tokenAddress);
    console.log("👤 Owner Address:", deployer.address);
    console.log("\n⚡ Next Steps:");
    console.log("1. Save contract address to FLO_TOKEN_CONTRACT_ADDRESS in .env");
    console.log("2. Verify contract:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${tokenAddress} "${deployer.address}"`);
    console.log("3. View on PolygonScan:");

    if (hre.network.name === "polygon") {
        console.log(`   https://polygonscan.com/address/${tokenAddress}`);
    } else if (hre.network.name === "mumbai") {
        console.log(`   https://mumbai.polygonscan.com/address/${tokenAddress}`);
    }

    // Get initial supply
    const totalSupply = await token.totalSupply();
    console.log("\n💰 Initial Supply:", hre.ethers.formatEther(totalSupply), "FLO");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
