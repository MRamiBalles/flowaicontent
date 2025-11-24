const hre = require("hardhat");

async function main() {
    console.log("Deploying FlowToken...");

    const FlowToken = await hre.ethers.getContractFactory("FlowToken");
    const flowToken = await FlowToken.deploy();

    await flowToken.waitForDeployment();

    const address = await flowToken.getAddress();
    console.log(`FlowToken deployed to: ${address}`);

    // Verification (optional)
    if (process.env.POLYGONSCAN_API_KEY) {
        console.log("Waiting for block confirmations...");
        await flowToken.deploymentTransaction().wait(5);
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
