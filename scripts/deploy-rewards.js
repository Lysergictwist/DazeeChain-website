const { ethers } = require("hardhat");

async function main() {
    // Get the DazeeCoin contract address
    const DazeeCoin = await ethers.getContractFactory("DazeeCoin");
    const dazeeCoin = await DazeeCoin.attach("YOUR_DAZEECOIN_CONTRACT_ADDRESS");

    // Deploy DazeeRewards
    const DazeeRewards = await ethers.getContractFactory("DazeeRewards");
    console.log("Deploying DazeeRewards...");
    const dazeeRewards = await DazeeRewards.deploy(dazeeCoin.address);
    await dazeeRewards.deployed();
    console.log("DazeeRewards deployed to:", dazeeRewards.address);

    // Transfer DZ tokens to the rewards contract
    const amount = ethers.utils.parseEther("1000000"); // 1 million DZ for rewards
    await dazeeCoin.transfer(dazeeRewards.address, amount);
    console.log("Transferred initial DZ tokens to rewards contract");

    // Verify contract on Polygonscan
    console.log("Verifying contract on Polygonscan...");
    await hre.run("verify:verify", {
        address: dazeeRewards.address,
        constructorArguments: [dazeeCoin.address],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
