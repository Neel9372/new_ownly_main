import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyValuation", function () {

    async function deployValuation() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [admin, propertyContract, randomUser] = await ethers.getSigners();

        const OwnlyValuation = await ethers.getContractFactory("OwnlyValuation");
        const valuation = await OwnlyValuation.deploy();

        return { valuation, admin, propertyContract, randomUser, ethers };
    }

    async function deployAndInit() {
        const { valuation, admin, propertyContract, randomUser, ethers } = await deployValuation();

        await valuation.setPropertyContract(propertyContract.address);

        await valuation.initializeProperty(
            1, 5,
            ethers.parseEther("10"),
            10000n, 200n, 100n
        );

        return { valuation, admin, propertyContract, randomUser, ethers };
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set correct admin", async function () {
            const { valuation, admin } = await deployValuation();
            expect(await valuation.admin()).to.equal(admin.address);
        });
    });

    // ─── Setup Tests ──────────────────────────────────────

    describe("Setup", function () {
        it("should set property contract address", async function () {
            const { valuation, propertyContract } = await deployValuation();
            await valuation.setPropertyContract(propertyContract.address);
            expect(await valuation.propertyContract())
                .to.equal(propertyContract.address);
        });

        it("should NOT allow non-admin to set property contract", async function () {
            const { valuation, randomUser } = await deployValuation();
            await expect(
                valuation.connect(randomUser)
                    .setPropertyContract(randomUser.address)
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Initialize Property Tests ────────────────────────

    describe("Initialize Property", function () {
        it("should initialize property with correct values", async function () {
            const { valuation, ethers } = await deployAndInit();

            const val = await valuation.getValuation(1);
            expect(val.dbPropertyId).to.equal(5n);
            expect(val.currentValue).to.equal(ethers.parseEther("10"));
            expect(val.initialValue).to.equal(ethers.parseEther("10"));
            expect(val.platformFeeRate).to.equal(200n);
            expect(val.mgmtFeeRate).to.equal(100n);
            expect(val.exists).to.equal(true);
        });

        it("should NOT initialize same property twice", async function () {
            const { valuation, ethers } = await deployAndInit();

            await expect(
                valuation.initializeProperty(
                    1, 5,
                    ethers.parseEther("10"),
                    10000n, 200n, 100n
                )
            ).to.be.revertedWith("Already initialized");
        });

        it("should allow property contract to initialize", async function () {
            const { valuation, propertyContract, ethers } = await deployAndInit();

            await valuation.connect(propertyContract).initializeProperty(
                2, 6,
                ethers.parseEther("20"),
                5000n, 200n, 100n
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
                    10000n, 200n, 100n
                )
            ).to.be.revertedWith("Not authorized");
        });
    }); // ← closes Initialize Property

    // ─── NAV Tests ────────────────────────────────────────

    describe("NAV Calculation", function () {
        it("should return initial value as NAV when no tokens", async function () {
            const { valuation, propertyContract, ethers } = await deployValuation();

            await valuation.setPropertyContract(propertyContract.address);

            await valuation.initializeProperty(
                1, 5,
                ethers.parseEther("10"),
                0n,
                200n, 100n
            );

            const nav = await valuation.getCurrentNAV(1);
            expect(nav).to.equal(ethers.parseEther("10"));
        });

        it("should calculate correct NAV after tokens set", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updateTotalTokens(1, 10000n);

            const nav = await valuation.getCurrentNAV(1);
            const expectedNAV = ethers.parseEther("9.7") / 10000n;
            expect(nav).to.equal(expectedNAV);
        });

        it("should increase NAV when property value increases", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updateTotalTokens(1, 10000n);
            const navBefore = await valuation.getCurrentNAV(1);

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11.5")
            );

            const navAfter = await valuation.getCurrentNAV(1);
            expect(navAfter).to.be.greaterThan(navBefore);
        });

        it("should increase NAV when rent collected", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updateTotalTokens(1, 10000n);
            const navBefore = await valuation.getCurrentNAV(1);

            await valuation.updateRentCollected(
                1, ethers.parseEther("0.5")
            );

            const navAfter = await valuation.getCurrentNAV(1);
            expect(navAfter).to.be.greaterThan(navBefore);
        });
    }); // ← closes NAV Calculation

    // ─── Update Tests ─────────────────────────────────────

    describe("Update Property Value", function () {
        it("should update property value correctly", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("12")
            );

            const val = await valuation.getValuation(1);
            expect(val.currentValue).to.equal(ethers.parseEther("12"));
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

        it("should allow property contract to update rent", async function () {
            const { valuation, propertyContract, ethers } = await deployAndInit();

            await valuation.connect(propertyContract).updateRentCollected(
                1, ethers.parseEther("0.5")
            );

            const val = await valuation.getValuation(1);
            expect(val.totalRentCollected).to.equal(ethers.parseEther("0.5"));
        });
    }); // ← closes Update Property Value

    // ─── Appreciation Tests ───────────────────────────────

    describe("Appreciation", function () {
        it("should return 0 appreciation when value unchanged", async function () {
            const { valuation } = await deployAndInit();
            expect(await valuation.getAppreciation(1)).to.equal(0n);
        });

        it("should calculate appreciation correctly", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11.5")
            );

            expect(await valuation.getAppreciation(1)).to.equal(1500n);
        });

        it("should return 0 when value decreases", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("8")
            );

            expect(await valuation.getAppreciation(1)).to.equal(0n);
        });
    }); // ← closes Appreciation

    // ─── NAV History Tests ────────────────────────────────

    describe("NAV History", function () {
        it("should record NAV on initialization", async function () {
            const { valuation } = await deployAndInit();

            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(1);
        });

        it("should record NAV on each update", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11")
            );
            await valuation.updateRentCollected(
                1, ethers.parseEther("0.5")
            );

            const history = await valuation.getNAVHistory(1);
            expect(history.length).to.equal(3);
        });

        it("should have increasing timestamps in history", async function () {
            const { valuation, ethers } = await deployAndInit();

            await valuation.updatePropertyValue(
                1, ethers.parseEther("11")
            );

            const history = await valuation.getNAVHistory(1);
            expect(history[1].timestamp)
                .to.be.greaterThanOrEqual(history[0].timestamp);
        });
    }); // ← closes NAV History

}); // ← closes OwnlyValuation