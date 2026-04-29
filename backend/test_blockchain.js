/**
 * Test script to verify blockchain integration is working
 * Run: node test_blockchain.js
 * 
 * This tests:
 * 1. Can we connect to Amoy?
 * 2. Can we read from contracts?
 * 3. Can we create a property on-chain?
 * 4. Can we read that property back?
 */

require("dotenv").config({ path: "../.env" });

const {
  wallet,
  propertyContract,
  mockINRC,
  createPropertyOnChain,
  getPropertyFromChain,
  getPropertyCount,
  getWalletBalance,
  deployedAddresses,
} = require("./service/blockchainService");

async function runTests() {
  console.log("═══════════════════════════════════════════");
  console.log("  OWNLY Blockchain Integration Tests");
  console.log("═══════════════════════════════════════════\n");

  // Test 1: Connection
  console.log("TEST 1: Connection to Amoy");
  console.log("─────────────────────────────");
  const balance = await getWalletBalance();
  console.log("  Wallet address:", wallet.address);
  console.log("  Balance:", balance, "POL/MATIC");
  console.log("  ✅ Connected to Amoy!\n");

  // Test 2: Read contract state
  console.log("TEST 2: Read contract state");
  console.log("─────────────────────────────");
  const count = await getPropertyCount();
  console.log("  Properties on-chain:", count);
  
  const owner = await propertyContract.owner();
  console.log("  Contract owner:", owner);
  console.log("  Our wallet:", wallet.address);
  console.log("  Are we owner?", owner.toLowerCase() === wallet.address.toLowerCase() ? "✅ YES" : "❌ NO");
  
  const platformFee = await propertyContract.platformFeeRate();
  console.log("  Platform fee rate:", platformFee.toString(), "(200 = 2%)");
  console.log("");

  // Test 3: Read INRC balance
  console.log("TEST 3: MockINRC token");
  console.log("─────────────────────────────");
  try {
    const inrcBalance = await mockINRC.balanceOf(wallet.address);
    const { ethers } = require("ethers");
    console.log("  Admin INRC balance:", ethers.formatEther(inrcBalance), "INRC");
    console.log("  ✅ MockINRC readable!\n");
  } catch (err) {
    console.log("  ⚠️  Could not read INRC:", err.message, "\n");
  }

  // Test 4: Create a test property on-chain
  console.log("TEST 4: Create test property on-chain");
  console.log("─────────────────────────────────────────");
  console.log("  Creating 'Test Villa Mumbai' with 1000 tokens...");
  
  const result = await createPropertyOnChain(
    "Test Villa Mumbai",     // name
    "Mumbai, Maharashtra",   // location
    9999,                    // fake DB id (just for testing)
    "1000",                  // total value in MATIC (1000 MATIC)
    1000,                    // total tokens
    "TOWN9999"               // token symbol
  );

  if (result.success) {
    console.log("  ✅ Property created on-chain!");
    console.log("  Tx hash:", result.txHash);
    console.log("  On-chain ID:", result.onChainPropertyId);
    console.log("  Token address:", result.tokenAddress);
    console.log("");

    // Test 5: Read the property we just created
    console.log("TEST 5: Read property back from chain");
    console.log("─────────────────────────────────────────");
    const prop = await getPropertyFromChain(result.onChainPropertyId);
    if (prop) {
      console.log("  Name:", prop.name);
      console.log("  Location:", prop.location);
      console.log("  Total Value:", prop.totalValue, "MATIC");
      console.log("  Total Tokens:", prop.totalTokens);
      console.log("  Is Active:", prop.isActive);
      console.log("  Token Address:", prop.tokenAddress);
      console.log("  ✅ Can read property from blockchain!\n");
    }
  } else {
    console.log("  ❌ Failed:", result.error);
    console.log("  (This might fail if you don't have enough MATIC for gas)\n");
  }

  // Summary
  console.log("═══════════════════════════════════════════");
  console.log("  Test Summary");
  console.log("═══════════════════════════════════════════");
  console.log("  You can verify these on Polygonscan:");
  console.log("  https://amoy.polygonscan.com/address/" + deployedAddresses.contracts.OwnlyProperty);
  console.log("");
  console.log("  New property count:", await getPropertyCount());
  console.log("═══════════════════════════════════════════");
}

runTests().catch(console.error);
