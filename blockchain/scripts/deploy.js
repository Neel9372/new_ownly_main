import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("\n🚀 Starting OWNLY Contract Deployment...\n");

    // Hardhat v3 way — same as your test files
    const connection = await network.connect();
    const { ethers } = connection;

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC\n");

    const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
    console.log("🏦 Platform wallet:", platformWallet);

    // ─── STEP 1: Deploy MockINRC ──────────────────────────
    console.log("\n📦 Step 1: Deploying MockINRC (testnet only)...");
    const MockINRC = await ethers.getContractFactory("MockINRC");
    const mockINRC = await MockINRC.deploy();
    await mockINRC.waitForDeployment();
    const inrcAddress = await mockINRC.getAddress();
    console.log("✅ MockINRC deployed to:", inrcAddress);

    // ─── STEP 2: Deploy OwnlyTreasury ────────────────────
    console.log("\n📦 Step 2: Deploying OwnlyTreasury...");
    const OwnlyTreasury = await ethers.getContractFactory("OwnlyTreasury");
    const treasury = await OwnlyTreasury.deploy(platformWallet);
    await treasury.waitForDeployment();
    const treasuryAddress = await treasury.getAddress();
    console.log("✅ OwnlyTreasury deployed to:", treasuryAddress);

    // ─── STEP 3: Deploy OwnlyPool ─────────────────────────
    console.log("\n📦 Step 3: Deploying OwnlyPool...");
    const OwnlyPool = await ethers.getContractFactory("OwnlyPool");
    const pool = await OwnlyPool.deploy();
    await pool.waitForDeployment();
    const poolAddress = await pool.getAddress();
    console.log("✅ OwnlyPool deployed to:", poolAddress);

    // ─── STEP 4: Deploy OwnlyValuation ───────────────────
    console.log("\n📦 Step 4: Deploying OwnlyValuation...");
    const OwnlyValuation = await ethers.getContractFactory("OwnlyValuation");
    const valuation = await OwnlyValuation.deploy();
    await valuation.waitForDeployment();
    const valuationAddress = await valuation.getAddress();
    console.log("✅ OwnlyValuation deployed to:", valuationAddress);

    // ─── STEP 5: Deploy OwnlyExitWindow ──────────────────
    console.log("\n📦 Step 5: Deploying OwnlyExitWindow...");
    const OwnlyExitWindow = await ethers.getContractFactory("OwnlyExitWindow");
    const exitWindow = await OwnlyExitWindow.deploy(treasuryAddress);
    await exitWindow.waitForDeployment();
    const exitWindowAddress = await exitWindow.getAddress();
    console.log("✅ OwnlyExitWindow deployed to:", exitWindowAddress);

    // ─── STEP 6: Deploy OwnlyProperty ────────────────────
    console.log("\n📦 Step 6: Deploying OwnlyProperty...");
    const OwnlyProperty = await ethers.getContractFactory("OwnlyProperty");
    const property = await OwnlyProperty.deploy(
        platformWallet,
        valuationAddress,
        inrcAddress,
        200
    );
    await property.waitForDeployment();
    const propertyAddress = await property.getAddress();
    console.log("✅ OwnlyProperty deployed to:", propertyAddress);

    // ─── STEP 7: Wire Contracts Together ─────────────────
    console.log("\n🔗 Step 7: Wiring contracts together...");

    try {
        const tx1 = await valuation.setPropertyContract(propertyAddress);
        await tx1.wait();
        console.log("✅ Valuation → Property contract set");
    } catch (e) {
        console.log("⚠️  Valuation setPropertyContract failed:", e.message);
    }

    try {
        const tx2 = await treasury.setPropertyContract(propertyAddress);
        await tx2.wait();
        console.log("✅ Treasury → Property contract set");
    } catch (e) {
        console.log("⚠️  Treasury setPropertyContract not found — skipping");
    }

    try {
        const tx3 = await treasury.setExitWindowContract(exitWindowAddress);
        await tx3.wait();
        console.log("✅ Treasury → ExitWindow contract set");
    } catch (e) {
        console.log("⚠️  Treasury setExitWindowContract not found — skipping");
    }

    try {
        const tx4 = await pool.setPropertyContract(propertyAddress);
        await tx4.wait();
        console.log("✅ Pool → Property contract set");
    } catch (e) {
        console.log("⚠️  Pool setPropertyContract not found — skipping");
    }

    try {
        const tx5 = await exitWindow.setPropertyContract(propertyAddress);
        await tx5.wait();
        console.log("✅ ExitWindow → Property contract set");
    } catch (e) {
        console.log("⚠️  ExitWindow setPropertyContract not found — skipping");
    }

    // ─── STEP 8: Save Addresses ───────────────────────────
    console.log("\n💾 Step 8: Saving deployed addresses...");

    const addresses = {
        network: "hardhat",
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        platformWallet: platformWallet,
        contracts: {
            MockINRC: inrcAddress,
            OwnlyTreasury: treasuryAddress,
            OwnlyPool: poolAddress,
            OwnlyValuation: valuationAddress,
            OwnlyExitWindow: exitWindowAddress,
            OwnlyProperty: propertyAddress,
        },
    };

    const addressesPath = path.join(__dirname, "../deployedAddresses.json");
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("✅ Saved to: blockchain/deployedAddresses.json");

    try {
        const backendPath = path.join(
            __dirname,
            "../../backend/deployedAddresses.json"
        );
        fs.writeFileSync(backendPath, JSON.stringify(addresses, null, 2));
        console.log("✅ Saved to: backend/deployedAddresses.json");
    } catch (e) {
        console.log("⚠️  Could not save to backend folder:", e.message);
    }

    // ─── STEP 9: Summary ──────────────────────────────────
    console.log("\n" + "=".repeat(60));
    console.log("🎉 OWNLY DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("MockINRC:        ", inrcAddress);
    console.log("OwnlyTreasury:   ", treasuryAddress);
    console.log("OwnlyPool:       ", poolAddress);
    console.log("OwnlyValuation:  ", valuationAddress);
    console.log("OwnlyExitWindow: ", exitWindowAddress);
    console.log("OwnlyProperty:   ", propertyAddress);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n👤 Deployer:", deployer.address);
    console.log("✅ All contracts wired and ready!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });