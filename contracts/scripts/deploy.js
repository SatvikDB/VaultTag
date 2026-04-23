import hre from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const VaultTag = await hre.ethers.getContractFactory("VaultTag");
  const vaultTag = await VaultTag.deploy();

  await vaultTag.waitForDeployment();
  const address = await vaultTag.getAddress();
  
  console.log(`VaultTag deployed to: ${address}`);

  // Update the backend .env file with the contract address
  const envPath = path.join(__dirname, '../../backend/.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/g,
      `CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated backend .env with the new contract address!");
  } else {
    console.warn("⚠️ Could not find backend .env to update automatically.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
