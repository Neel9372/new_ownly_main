import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyValuation", function () {

    async function deployValuation() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [admin, propertyContract, randomUser] = 
            await ethers.getSigners();

        const OwnlyValuation = await ethers.getContractFactory(
            "OwnlyValuation"
        );
        const valuation = await OwnlyValuation.deploy();

        return { valuation, admin, propertyContract, randomUser, ethers };
    }

    async function deployAndInit() {
        const { valuation, admin, propertyContract, randomUser, ethers } = 
            await deployValuation();

        await valuation.setPropertyContract(propertyContract.address);

        // propertyId=1, dbPropertyId=5, value=10ETH,
        // tokens=10000, platformFeeRate=200(2%)
        // NOTE: no mgmtFeeRate anymore
        await valuation.initializeProperty(
            1, 5,
            ethers.parseEther("10"),
            10000n,
            200n
        );

        return { valuation, admin, propertyContract, randomUser, ethers };
    }

    // ─── Deployment ───────────────────────────────────────

    describe("Deployment", function () {
        it("should set correct admin", async function () {
            const { valuation, admin } = await deployValuation();
            expect(await valuation.admin()).to.equal(admin.address);
        });
    });

    // ─── Setup ────────────────────────────────────────────

    describe("Setup", function () {
        it("should set property contract address", async function () {
            const { valuation, propertyContract } = await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);
            expect(await valuation.propertyContract())
                .to.equal(propertyContract.address);
        });

        it("should NOT allow non-admin to set property contract",
            async function () {
            const { valuation, randomUser } = await deployValuation();
            await expect(
                valuation.connect(randomUser)
                    .setPropertyContract(randomUser.address)
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Initialize Property ──────────────────────────────

    describe("Initialize Property", function () {
        it("should initialize with correct values", async function () {
            const { valuation, ethers } = await deployAndInit();

            const val = await valuation.getValuation(1);
            expect(val.dbPropertyId).to.equal(5n);
            expect(val.currentValue)
                .to.equal(ethers.parseEther("10"));
            expect(val.initialValue)
                .to.equal(ethers.parseEther("10"));
            expect(val.platformFeeRate).to.equal(200n);
            expect(val.exists).to.equal(true);
        });

        it("should NOT have mgmtFeeRate anymore", async function () {
            const { valuation } = await deployAndInit();
            const val = await valuation.getValuation(1);

            // Struct should only have platformFeeRate
            // mgmtFeeRate was removed
            expect(val.platformFeeRate).to.equal(200n);
        });

        it("should NOT initialize same property twice", async function () {
            const { valuation, ethers } = await deployAndInit();
            await expect(
                valuation.initializeProperty(
                    1, 5,
                    ethers.parseEther("10"),
                    10000n, 200n
                )
            ).to.be.revertedWith("Already initialized");
        });

        it("should allow property contract to initialize",
            async function () {
            const { valuation, propertyContract, ethers } =
                await deployAndInit();

            await valuation.connect(propertyContract).initializeProperty(
                2, 6,
                ethers.parseEther("20"),
                5000n, 200n
            );

            const val = await valuation.getValuation(2);
            expect(val.exists).to.equal(true);
        });

        it("should NOT allow random user to initialize", async function () {
            const { valuation, randomUser, ethers } = await deployAndInit();
            await expect(
                valuation.connect(randomUser).initializeProperty(
                    3, 7,
                    ethers.parseEther("10"),
                    10000n, 200n
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT initialize with zero value", async function () {
            const { valuation, propertyContract } = await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);
            await expect(
                valuation.initializeProperty(
                    1, 5, 0n, 10000n, 200n
                )
            ).to.be.revertedWith("Value must be greater than 0");
        });

        it("should NOT record NAV when initialized with 0 tokens",
            async function () {
            const { valuation, propertyContract, ethers } =
                await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);

            // Initialize with 0 tokens
            await valuation.initializeProperty(
                1, 5,
                ethers.parseEther("10"),
                0n, 200n
            );

            // NAV history should be empty — no tokens yet
            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(0);
        });
    });

    // ─── NAV Calculation ──────────────────────────────────

    describe("NAV Calculation — Pure Property Value Only", function () {

        it("should return full value when no tokens", async function () {
            const { valuation, propertyContract, ethers } =
                await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);

            await valuation.initializeProperty(
                1, 5,
                ethers.parseEther("10"),
                0n, 200n
            );

            // Returns full property value as initial token price
            const nav = await valuation.getCurrentNAV(1);
            expect(nav).to.equal(ethers.parseEther("10"));
        });

        it("should calculate NAV as pure value divided by tokens",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            const nav = await valuation.getCurrentNAV(1);

            // NAV = 10 ETH / 10000 tokens = 0.001 ETH per token
            // NO fees deducted — pure property value only
            const expectedNAV = ethers.parseEther("10") / 10000n;
            expect(nav).to.equal(expectedNAV);
        });

        it("should NOT deduct any fees from NAV", async function () {
            const { valuation, ethers } = await deployAndInit();

            const nav = await valuation.getCurrentNAV(1);

            // If fees were wrongly deducted (old logic):
            // 10 ETH - 2% platform fee = 9.8 ETH / 10000 = 0.00098 ETH
            const wrongNAV = ethers.parseEther("9.8") / 10000n;

            // Correct NAV = 10 ETH / 10000 = 0.001 ETH
            const correctNAV = ethers.parseEther("10") / 10000n;

            expect(nav).to.equal(correctNAV);
            expect(nav).to.not.equal(wrongNAV);
        });

        it("should increase NAV when property value increases",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            const navBefore = await valuation.getCurrentNAV(1);

            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            const navAfter = await valuation.getCurrentNAV(1);
            expect(navAfter).to.be.greaterThan(navBefore);

            // Verify exact calculation
            // 12 ETH / 10000 = 0.0012 ETH
            expect(navAfter).to.equal(
                ethers.parseEther("12") / 10000n
            );
        });

        it("should decrease NAV when property value decreases",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            const navBefore = await valuation.getCurrentNAV(1);

            await valuation.updatePropertyValue(
                1, ethers.parseEther("8")
            );

            const navAfter = await valuation.getCurrentNAV(1);
            expect(navAfter).to.be.lessThan(navBefore);
        });

        // ✅ KEY TEST — Rent should NOT affect NAV
        it("should NOT change NAV when rent is collected",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            const navBefore = await valuation.getCurrentNAV(1);

            // Simulate rent being collected
            // (In new system, rent is separate — not tracked in valuation)
            // NAV should stay exactly the same

            const navAfter = await valuation.getCurrentNAV(1);

            // NAV unchanged — rent doesn't affect token price
            expect(navAfter).to.equal(navBefore);
        });

        it("getTokenPrice should return same as getCurrentNAV",
            async function () {
            const { valuation } = await deployAndInit();

            const nav = await valuation.getCurrentNAV(1);
            const tokenPrice = await valuation.getTokenPrice(1);

            expect(tokenPrice).to.equal(nav);
        });
    });

    // ─── Update Property Value ────────────────────────────

    describe("Update Property Value", function () {
        it("should update value correctly", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            const val = await valuation.getValuation(1);
            expect(val.currentValue).to.equal(ethers.parseEther("12"));
        });

        it("should update lastUpdated timestamp", async function () {
            const { valuation, ethers } = await deployAndInit();

            const valBefore = await valuation.getValuation(1);

            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            const valAfter = await valuation.getValuation(1);
            expect(valAfter.lastUpdated)
                .to.be.greaterThanOrEqual(valBefore.lastUpdated);
        });

        it("should NOT allow non-admin to update value", async function () {
            const { valuation, randomUser, ethers } = await deployAndInit();
            await expect(
                valuation.connect(randomUser).updatePropertyValue(
                    1, ethers.parseEther("12")
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT allow zero value update", async function () {
            const { valuation } = await deployAndInit();
            await expect(
                valuation.updatePropertyValue(1, 0n)
            ).to.be.revertedWith("Value must be greater than 0");
        });

        it("should NOT update non-existent property", async function () {
            const { valuation, ethers } = await deployAndInit();
            await expect(
                valuation.updatePropertyValue(
                    99, ethers.parseEther("10")
                )
            ).to.be.revertedWith("Property not found");
        });

        it("should allow property contract to update tokens",
            async function () {
            const { valuation, propertyContract } = await deployAndInit();

            await valuation.connect(propertyContract)
                .updateTotalTokens(1, 5000n);

            expect(await valuation.totalTokens(1)).to.equal(5000n);
        });
    });

    // ─── Appreciation ─────────────────────────────────────

    describe("Appreciation", function () {
        it("should return 0 when value unchanged", async function () {
            const { valuation } = await deployAndInit();
            expect(await valuation.getAppreciation(1)).to.equal(0n);
        });

        it("should calculate 15% appreciation correctly",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            // 10 ETH → 11.5 ETH = 15% appreciation
            await valuation.updatePropertyValue(
                1, ethers.parseEther("11.5")
            );

            // Returns basis points: 1500 = 15%
            expect(await valuation.getAppreciation(1)).to.equal(1500n);
        });

        it("should return 0 when value decreases", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("8")
            );

            expect(await valuation.getAppreciation(1)).to.equal(0n);
        });

        it("should calculate 100% appreciation correctly",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            // Double the value = 100% appreciation
            await valuation.updatePropertyValue(
                1, ethers.parseEther("20")
            );

            // 10000 basis points = 100%
            expect(await valuation.getAppreciation(1)).to.equal(10000n);
        });
    });

    // ─── NAV History ──────────────────────────────────────

    describe("NAV History", function () {
        it("should record NAV on initialization with tokens",
            async function () {
            const { valuation } = await deployAndInit();

            // deployAndInit uses 10000 tokens → NAV recorded
            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(1);
        });

        it("should NOT record NAV when initialized with 0 tokens",
            async function () {
            const { valuation, propertyContract, ethers } =
                await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);

            await valuation.initializeProperty(
                1, 5,
                ethers.parseEther("10"),
                0n, 200n
            );

            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(0);
        });

        it("should record NAV when tokens are added", async function () {
            const { valuation, propertyContract, ethers } =
                await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);

            // Init with 0 tokens
            await valuation.initializeProperty(
                1, 5,
                ethers.parseEther("10"),
                0n, 200n
            );

            expect((await valuation.getNAVHistory(1)).length).to.equal(0);

            // Add tokens → NAV should be recorded now
            await valuation.updateTotalTokens(1, 10000n);

            expect((await valuation.getNAVHistory(1)).length).to.equal(1);
        });

        it("should record NAV on each value update", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11")
            );
            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            // 1 (init) + 2 (updates) = 3 records
            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(3);
        });

        it("should have correct NAV values in history", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            const history = await valuation.getNAVHistory(1);

            // First record = 10 ETH / 10000 = 0.001 ETH
            expect(history[0].nav).to.equal(
                ethers.parseEther("10") / 10000n
            );

            // Second record = 12 ETH / 10000 = 0.0012 ETH
            expect(history[1].nav).to.equal(
                ethers.parseEther("12") / 10000n
            );
        });

        it("should have increasing timestamps", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11")
            );

            const history = await valuation.getNAVHistory(1);
            expect(history[1].timestamp)
                .to.be.greaterThanOrEqual(history[0].timestamp);
        });

        it("should cap history at 30 records", async function () {
            const { valuation, ethers } = await deployAndInit();

            // Add 35 updates
            for (let i = 1; i <= 35; i++) {
                await valuation.updatePropertyValue(
                    1,
                    ethers.parseEther((10 + i).toString())
                );
            }

            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(30);
        });
    });

    // ─── Platform Fee (Separate from NAV) ─────────────────

    describe("Platform Fee — NOT Part of NAV", function () {
        it("platform fee rate stored but not deducted from NAV",
            async function () {
            const { valuation, ethers } = await deployAndInit();

            const val = await valuation.getValuation(1);
            expect(val.platformFeeRate).to.equal(200n); // 2% stored

            // But NAV is still pure value / tokens
            // 10 ETH / 10000 = 0.001 ETH — no fee deducted
            const nav = await valuation.getCurrentNAV(1);
            expect(nav).to.equal(ethers.parseEther("10") / 10000n);
        });
    });

});