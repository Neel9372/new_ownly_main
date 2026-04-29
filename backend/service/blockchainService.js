/**
 * Blockchain Service — connects backend to OWNLY smart contracts on Amoy
 * 
 * This service:
 * 1. Creates a provider (connection to Amoy RPC)
 * 2. Creates a wallet (signs txs with deployer's private key)
 * 3. Instantiates contract objects for OwnlyProperty, MockINRC, OwnlyToken
 * 4. Exposes helper functions that controllers can call
 */

const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

// Load deployed addresses
const deployedAddresses = require("../deployedAddresses.json");

// Load ABIs
const OwnlyPropertyABI = require("../contracts/OwnlyProperty.json").abi;
const MockINRCABI = require("../contracts/MockINRC.json").abi;
const OwnlyTokenABI = require("../contracts/OwnlyToken.json").abi;

// ─── Provider & Wallet Setup ─────────────────────────────
const provider = new ethers.JsonRpcProvider(
  process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"
);

// Fallback to a random private key if not set in .env (to prevent server crash on startup)
const privateKey = process.env.AMOY_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
const wallet = new ethers.Wallet(privateKey, provider);

console.log("🔗 Blockchain service initialized");
console.log("   Network: Polygon Amoy Testnet");
console.log("   Wallet:", wallet.address);

// ─── Contract Instances ──────────────────────────────────
const propertyContract = new ethers.Contract(
  deployedAddresses.contracts.OwnlyProperty,
  OwnlyPropertyABI,
  wallet // wallet = signer, so we can send transactions
);

const mockINRC = new ethers.Contract(
  deployedAddresses.contracts.MockINRC,
  MockINRCABI,
  wallet
);

// ─── Helper Functions ────────────────────────────────────

/**
 * Create a property on the blockchain
 * Called when admin lists a new property
 * Only the contract owner (deployer) can call this
 */
async function createPropertyOnChain(name, location, dbPropertyId, totalValue, totalTokens, tokenSymbol) {
  try {
    console.log(`\n📦 Creating property on-chain: ${name}`);
    
    const tx = await propertyContract.createProperty(
      name,
      location,
      dbPropertyId,
      ethers.parseEther(totalValue.toString()), // Convert to wei
      totalTokens,
      tokenSymbol
    );
    
    console.log("   Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("   ✅ Confirmed in block:", receipt.blockNumber);
    
    // Extract the PropertyCreated event to get the on-chain property ID
    const event = receipt.logs.find(log => {
      try {
        return propertyContract.interface.parseLog(log)?.name === "PropertyCreated";
      } catch { return false; }
    });
    
    let onChainPropertyId = null;
    let tokenAddress = null;
    
    if (event) {
      const parsed = propertyContract.interface.parseLog(event);
      onChainPropertyId = parsed.args[0].toString();
      tokenAddress = parsed.args[2];
      console.log("   On-chain property ID:", onChainPropertyId);
      console.log("   Token address:", tokenAddress);
    }
    
    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      onChainPropertyId,
      tokenAddress
    };
    
  } catch (err) {
    console.error("   ❌ On-chain createProperty failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get property info from the blockchain
 */
async function getPropertyFromChain(propertyId) {
  try {
    const prop = await propertyContract.getProperty(propertyId);
    return {
      name: prop.name,
      location: prop.location,
      dbPropertyId: prop.dbPropertyId.toString(),
      totalValue: ethers.formatEther(prop.totalValue),
      totalTokens: prop.totalTokens.toString(),
      totalRaised: ethers.formatEther(prop.totalRaised),
      tokenAddress: prop.tokenAddress,
      isActive: prop.isActive,
      isSold: prop.isSold,
    };
  } catch (err) {
    console.error("Failed to read property from chain:", err.message);
    return null;
  }
}

/**
 * Get investor info from the blockchain
 */
async function getInvestorInfoFromChain(propertyId, investorAddress) {
  try {
    const info = await propertyContract.getInvestorInfo(propertyId, investorAddress);
    return {
      tokensOwned: info.tokensOwned.toString(),
      ownershipPercent: (Number(info.ownershipPercent) / 100).toFixed(2), // Convert basis points to %
      claimableRentINRC: ethers.formatEther(info.claimableRentINRC),
      currentNAV: ethers.formatEther(info.currentNAV),
      investmentValue: ethers.formatEther(info.investmentValue),
    };
  } catch (err) {
    console.error("Failed to read investor info:", err.message);
    return null;
  }
}

/**
 * Get token balance for an address
 */
async function getTokenBalance(tokenAddress, investorAddress) {
  try {
    const token = new ethers.Contract(tokenAddress, OwnlyTokenABI, provider);
    const balance = await token.balanceOf(investorAddress);
    return balance.toString();
  } catch (err) {
    console.error("Failed to get token balance:", err.message);
    return "0";
  }
}

/**
 * Get the on-chain property count
 */
async function getPropertyCount() {
  try {
    const count = await propertyContract.propertyCount();
    return count.toString();
  } catch (err) {
    console.error("Failed to get property count:", err.message);
    return "0";
  }
}

/**
 * Get deployer wallet balance
 */
async function getWalletBalance() {
  const balance = await provider.getBalance(wallet.address);
  return ethers.formatEther(balance);
}

/**
 * Distribute rent on the blockchain
 * Two-step process:
 * 1. Approve OwnlyProperty contract to spend INRC from admin wallet
 * 2. Call distributeRent on OwnlyProperty
 *
 * The smart contract then:
 * - Transfers INRC from admin to itself
 * - Calculates rent per token
 * - Investors can claim whenever they want (gas-efficient)
 */
async function distributeRentOnChain(onChainPropertyId, inrcAmount) {
  try {
    console.log(`\n💰 Distributing rent on-chain for property ${onChainPropertyId}`);
    console.log(`   Amount: ${inrcAmount} INRC`);

    const amountWei = ethers.parseEther(inrcAmount.toString());
    const propertyAddress = deployedAddresses.contracts.OwnlyProperty;

    // Step 1: Approve OwnlyProperty contract to spend INRC
    console.log("   Step 1: Approving INRC spend...");
    const approveTx = await mockINRC.approve(propertyAddress, amountWei);
    await approveTx.wait();
    console.log("   ✅ Approved");

    // Step 2: Call distributeRent
    console.log("   Step 2: Calling distributeRent...");
    const tx = await propertyContract.distributeRent(onChainPropertyId, amountWei);
    console.log("   Tx hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("   ✅ Rent distributed in block:", receipt.blockNumber);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
    };

  } catch (err) {
    console.error("   ❌ On-chain distributeRent failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  provider,
  wallet,
  propertyContract,
  mockINRC,
  createPropertyOnChain,
  getPropertyFromChain,
  getInvestorInfoFromChain,
  getTokenBalance,
  getPropertyCount,
  getWalletBalance,
  distributeRentOnChain,
  deployedAddresses,
};
