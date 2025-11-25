const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

    const deployedContracts = {};

    // 1. Deploy FlowToken
    console.log("\n📦 Deploying FlowToken...");
    const FlowToken = await hre.ethers.getContractFactory("FlowToken");
    const flowToken = await FlowToken.deploy();
    await flowToken.waitForDeployment();
    const flowTokenAddress = await flowToken.getAddress();
    deployedContracts.FlowToken = flowTokenAddress;
    console.log("✅ FlowToken deployed to:", flowTokenAddress);

    // 2. Deploy FlowStaking
    console.log("\n📦 Deploying FlowStaking...");
    const FlowStaking = await hre.ethers.getContractFactory("FlowStaking");
    const flowStaking = await FlowStaking.deploy(flowTokenAddress);
    await flowStaking.waitForDeployment();
    const flowStakingAddress = await flowStaking.getAddress();
    deployedContracts.FlowStaking = flowStakingAddress;
    console.log("✅ FlowStaking deployed to:", flowStakingAddress);

    // Grant MINTER_ROLE to staking contract
    console.log("\n🔑 Granting MINTER_ROLE to FlowStaking contract...");
    const MINTER_ROLE = await flowToken.MINTER_ROLE();
    const tx = await flowToken.grantRole(MINTER_ROLE, flowStakingAddress);
    await tx.wait();
    console.log("✅ MINTER_ROLE granted");

    // 3. Deploy FractionalNFT Factory (template)
    console.log("\n📦 Deploying FractionalNFT template...");
    const FractionalNFT = await hre.ethers.getContractFactory("FractionalNFT");
    const fractionalNFT = await FractionalNFT.deploy();
    await fractionalNFT.waitForDeployment();
    const fractionalNFTAddress = await fractionalNFT.getAddress();
    deployedContracts.FractionalNFT = fractionalNFTAddress;
    console.log("✅ FractionalNFT template deployed to:", fractionalNFTAddress);

    // 4. Deploy BountyEscrow
    console.log("\n📦 Deploying BountyEscrow...");
    const BountyEscrow = await hre.ethers.getContractFactory("BountyEscrow");
    const bountyEscrow = await BountyEscrow.deploy(flowTokenAddress);
    await bountyEscrow.waitForDeployment();
    const bountyEscrowAddress = await bountyEscrow.getAddress();
    deployedContracts.BountyEscrow = bountyEscrowAddress;
    console.log("✅ BountyEscrow deployed to:", bountyEscrowAddress);

    // Save deployment info
    const network = hre.network.name;
    const deploymentInfo = {
        network: network,
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: deployedContracts
    };

    const outputPath = path.join(__dirname, `../deployments/${network}.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment info saved to:", outputPath);
    console.log("\n✅ All contracts deployed successfully!");
    console.log("\n📋 Summary:");
    console.log(JSON.stringify(deployedContracts, null, 2));

    // Verification instructions
    if (process.env.POLYGONSCAN_API_KEY) {
        console.log("\n🔍 Waiting for block confirmations before verification...");
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        console.log("\n🔍 Verifying contracts on Polygonscan...");
        
        try {
            await hre.run("verify:verify", {
                address: flowTokenAddress,
                constructorArguments: [],
            });
            console.log("✅ FlowToken verified");
        } catch (e) {
            console.log("⚠️ FlowToken verification failed:", e.message);
        }

        try {
            await hre.run("verify:verify", {
                address: flowStakingAddress,
                constructorArguments: [flowTokenAddress],
            });
            console.log("✅ FlowStaking verified");
        } catch (e) {
            console.log("⚠️ FlowStaking verification failed:", e.message);
        }

        try {
            await hre.run("verify:verify", {
                address: fractionalNFTAddress,
                constructorArguments: [],
            });
            console.log("✅ FractionalNFT verified");
        } catch (e) {
            console.log("⚠️ FractionalNFT verification failed:", e.message);
        }

        try {
            await hre.run("verify:verify", {
                address: bountyEscrowAddress,
                constructorArguments: [flowTokenAddress],
            });
            console.log("✅ BountyEscrow verified");
        } catch (e) {
            console.log("⚠️ BountyEscrow verification failed:", e.message);
        }
    }

    console.log("\n🎉 Deployment complete!");
    console.log("\n⚙️ Next steps:");
    console.log("1. Update backend/.env with contract addresses");
    console.log("2. Update POLYGON_RPC_URL in backend/.env");
    console.log("3. Fund the FlowStaking contract with initial FLOW tokens for rewards");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
