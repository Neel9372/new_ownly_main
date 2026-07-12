import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("\n🚀 Setting up properties on OWNLY Contract...\n");

    const connection = await network.connect();
    const { ethers } = connection;
    const [deployer] = await ethers.getSigners();

    const addressesPath = path.join(__dirname, "../deployedAddresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const propertyAddress = addresses.contracts.OwnlyProperty;

    const OwnlyProperty = await ethers.getContractFactory("OwnlyProperty");
    const property = OwnlyProperty.attach(propertyAddress).connect(deployer);

    const properties = [
        { id: 1, title: "Skyline Towers - Phase 1", location: "Bandra West, Mumbai", tokens: 1000 },
        { id: 13, title: "test2", location: "Mumbai", tokens: 5000 },
        { id: 42, title: "qwerww", location: "qwer", tokens: 2000 },
        { id: 43, title: "sminu towers", location: "borivali", tokens: 10000 },
        { id: 44, title: "samarth niwas", location: "bandra", tokens: 50000 }
    ];

    for (const p of properties) {
        console.log(`Creating property ${p.title}...`);
        try {
            // totalValue is tokens * 1 MATIC, so NAV is exactly 1 MATIC
            const totalValue = ethers.parseEther(p.tokens.toString());
            const tx = await property.createProperty(
                p.title,
                p.location,
                p.id,
                totalValue,
                p.tokens,
                "OWN-" + p.id
            );
            await tx.wait();
            console.log(`✅ Property ${p.id} created`);
        } catch (e) {
            console.error(`❌ Failed to create property ${p.id}: ${e.message}`);
        }
    }

    console.log("\n🎉 SETUP COMPLETE!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Setup failed:", error);
        process.exit(1);
    });
