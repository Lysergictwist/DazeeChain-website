const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy DazeeCoin
    const DazeeCoin = await hre.ethers.getContractFactory("DazeeCoin");
    const dazeeCoin = await DazeeCoin.deploy();
    await dazeeCoin.deployed();
    console.log("DazeeCoin deployed to:", dazeeCoin.address);

    // Deploy DazeeGovernance
    const DazeeGovernance = await hre.ethers.getContractFactory("DazeeGovernance");
    const dazeeGovernance = await DazeeGovernance.deploy();
    await dazeeGovernance.deployed();
    console.log("DazeeGovernance deployed to:", dazeeGovernance.address);

    // Deploy ShelterSupportPool
    const ShelterSupportPool = await hre.ethers.getContractFactory("ShelterSupportPool");
    const shelterSupportPool = await ShelterSupportPool.deploy(dazeeCoin.address);
    await shelterSupportPool.deployed();
    console.log("ShelterSupportPool deployed to:", shelterSupportPool.address);

    // Deploy DazeeRewards
    const DazeeRewards = await hre.ethers.getContractFactory("DazeeRewards");
    const dazeeRewards = await DazeeRewards.deploy(dazeeCoin.address, dazeeGovernance.address);
    await dazeeRewards.deployed();
    console.log("DazeeRewards deployed to:", dazeeRewards.address);

    // Deploy AdoptionRewards
    const AdoptionRewards = await hre.ethers.getContractFactory("AdoptionRewards");
    const adoptionRewards = await AdoptionRewards.deploy(dazeeCoin.address);
    await adoptionRewards.deployed();
    console.log("AdoptionRewards deployed to:", adoptionRewards.address);

    // Set up contract relationships
    console.log("Setting up contract relationships...");

    // Set up ShelterSupportPool in DazeeCoin
    const setSupportPoolTx = await dazeeCoin.setShelterSupportPool(shelterSupportPool.address);
    await setSupportPoolTx.wait();
    console.log("ShelterSupportPool set in DazeeCoin");

    // Grant roles
    const MINTER_ROLE = await dazeeCoin.MINTER_ROLE();
    const ADMIN_ROLE = await dazeeGovernance.ADMIN_ROLE();
    const VERIFIER_ROLE = await dazeeGovernance.VERIFIER_ROLE();

    // Grant minter roles
    console.log("Granting roles...");
    await dazeeCoin.grantRole(MINTER_ROLE, dazeeRewards.address);
    await dazeeCoin.grantRole(MINTER_ROLE, adoptionRewards.address);
    
    // Grant governance roles to deployer
    await dazeeGovernance.grantRole(ADMIN_ROLE, deployer.address);
    await dazeeGovernance.grantRole(VERIFIER_ROLE, deployer.address);

    // Transfer initial tokens
    console.log("Transferring initial tokens...");
    
    // Transfer to reward pools
    const rewardPoolAmount = hre.ethers.utils.parseEther("1000000"); // 1M DZ
    await dazeeCoin.transfer(dazeeRewards.address, rewardPoolAmount);
    await dazeeCoin.transfer(adoptionRewards.address, rewardPoolAmount);
    
    // Initialize monthly reward pool
    await dazeeRewards.refreshRewardPool();

    // Verify contracts on Etherscan
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("Verifying contracts on Etherscan...");
        
        await hre.run("verify:verify", {
            address: dazeeCoin.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: dazeeGovernance.address,
            constructorArguments: []
        });

        await hre.run("verify:verify", {
            address: shelterSupportPool.address,
            constructorArguments: [dazeeCoin.address]
        });

        await hre.run("verify:verify", {
            address: dazeeRewards.address,
            constructorArguments: [dazeeCoin.address, dazeeGovernance.address]
        });

        await hre.run("verify:verify", {
            address: adoptionRewards.address,
            constructorArguments: [dazeeCoin.address]
        });
    }

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        dazeeCoin: dazeeCoin.address,
        dazeeGovernance: dazeeGovernance.address,
        shelterSupportPool: shelterSupportPool.address,
        dazeeRewards: dazeeRewards.address,
        adoptionRewards: adoptionRewards.address,
        timestamp: new Date().toISOString()
    };

    const fs = require('fs');
    fs.writeFileSync(
        'deployment-info.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment complete! Info saved to deployment-info.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
