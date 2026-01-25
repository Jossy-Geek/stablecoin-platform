import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying Stablecoin Contract...\n");

  // Get deployer account
  const [deployer, minter, burner] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Contract parameters
  const name = "Stablecoin Token";
  const symbol = "STC";
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const admin = deployer.address;
  const minterAddress = minter.address;
  const burnerAddress = burner.address;

  // Deploy Stablecoin contract
  const Stablecoin = await ethers.getContractFactory("Stablecoin");
  const stablecoin = await Stablecoin.deploy(
    name,
    symbol,
    initialSupply,
    admin,
    minterAddress,
    burnerAddress
  );

  await stablecoin.waitForDeployment();
  const contractAddress = await stablecoin.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Initial Supply:", ethers.formatEther(initialSupply), symbol);

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    contractAddress: contractAddress,
    deployer: deployer.address,
    minter: minterAddress,
    burner: burnerAddress,
    name: name,
    symbol: symbol,
    initialSupply: initialSupply.toString(),
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkDir = path.join(deploymentsDir, "localhost");
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(networkDir, "Stablecoin.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📝 Deployment info saved to deployments/localhost/Stablecoin.json");

  // Verify roles
  console.log("\n🔐 Verifying roles...");
  const hasMinterRole = await stablecoin.hasRole(
    await stablecoin.MINTER_ROLE(),
    minterAddress
  );
  const hasBurnerRole = await stablecoin.hasRole(
    await stablecoin.BURNER_ROLE(),
    burnerAddress
  );
  const hasPauserRole = await stablecoin.hasRole(
    await stablecoin.PAUSER_ROLE(),
    admin
  );

  console.log("MINTER_ROLE:", hasMinterRole ? "✅" : "❌");
  console.log("BURNER_ROLE:", hasBurnerRole ? "✅" : "❌");
  console.log("PAUSER_ROLE:", hasPauserRole ? "✅" : "❌");

  console.log("\n🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
