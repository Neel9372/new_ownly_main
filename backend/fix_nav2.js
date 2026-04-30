require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");
const deployedAddresses = require("./deployedAddresses.json");

async function fixNAV() {
  try {
    const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology/");
    const wallet = new ethers.Wallet(process.env.AMOY_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(deployedAddresses.contracts.OwnlyValuation, [
      "function updatePropertyValue(uint256,uint256) external",
      "function getCurrentNAV(uint256) view returns (uint256)"
    ], wallet);
    
    // Property 2 (which the user just created, mapped to db id 13) has totalTokens = 5000
    // To make NAV = 1 MATIC, we need totalValue = 5000 MATIC
    console.log("Setting property value to 5000 MATIC...");
    const tx = await contract.updatePropertyValue(2, ethers.parseEther("5000"));
    await tx.wait();
    console.log("Done!");
    
    const nav = await contract.getCurrentNAV(2);
    console.log("New NAV for onChainId 2:", ethers.formatEther(nav), "MATIC");
  } catch (e) {
    console.error(e);
  }
}

fixNAV();
