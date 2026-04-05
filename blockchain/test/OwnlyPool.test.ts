import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyPool", function () {

    async function deployPool() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [admin, propertyContract, investor1, investor2, randomUser] =
            await ethers.getSigners();

        const OwnlyPool = await ethers.getContractFactory("OwnlyPool");
        const pool = await OwnlyPool.deploy();

        return { pool, admin, propertyContract, investor1, investor2, randomUser, ethers };
    }

    async function deployAndSetup() {
        const { pool, admin, propertyContract, investor1, investor2, randomUser, ethers } =
            await deployPool();

        // Set property contract
        await pool.setPropertyContract(propertyContract.address);

        // Setup a pool for property 1
        await pool.setupPool(
            1,                              // propertyId
            5,                              // dbPropertyId
            ethers.parseEther("100"),       // totalSize
            ethers.parseEther("0.1")        // tokenPrice
        );

        return { pool, admin, propertyContract, investor1, investor2, randomUser, ethers };
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set correct admin", async function () {
            const { pool, admin } = await deployPool();
            expect(await pool.admin()).to.equal(admin.address);
        });
    });

    // ─── Setup Tests ──────────────────────────────────────

    describe("Setup Pool", function () {
        it("should setup pool with correct details", async function () {
            const { pool, ethers } = await deployAndSetup();

            const info = await pool.getPoolInfo(1);
            expect(info.dbPropertyId).to.equal(5n);
            expect(info.totalSize).to.equal(ethers.parseEther("100"));
            expect(info.tokenPrice).to.equal(ethers.parseEther("0.1"));
            expect(info.filledAmount).to.equal(0n);
            expect(info.filledPercent).to.equal(0n);
            expect(info.investorCount).to.equal(0n);
            expect(info.exists).to.equal(true);
        });

        it("should NOT allow setting up same pool twice", async function () {
            const { pool, ethers } = await deployAndSetup();

            await expect(
                pool.setupPool(1, 5, ethers.parseEther("100"), ethers.parseEther("0.1"))
            ).to.be.revertedWith("Pool already exists");
        });

        it("should NOT allow zero total size", async function () {
            const { pool, ethers } = await deployPool();

            await expect(
                pool.setupPool(1, 5, 0n, ethers.parseEther("0.1"))
            ).to.be.revertedWith("Total size must be greater than 0");
        });

        it("should NOT allow zero token price", async function () {
            const { pool, ethers } = await deployPool();

            await expect(
                pool.setupPool(1, 5, ethers.parseEther("100"), 0n)
            ).to.be.revertedWith("Token price must be greater than 0");
        });

        it("should NOT allow random user to setup pool", async function () {
            const { pool, randomUser, ethers } = await deployPool();

            await expect(
                pool.connect(randomUser).setupPool(
                    1, 5, ethers.parseEther("100"), ethers.parseEther("0.1")
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should allow property contract to setup pool", async function () {
            const { pool, propertyContract, ethers } = await deployPool();

            await pool.setPropertyContract(propertyContract.address);

            await pool.connect(propertyContract).setupPool(
                1, 5, ethers.parseEther("100"), ethers.parseEther("0.1")
            );

            const info = await pool.getPoolInfo(1);
            expect(info.exists).to.equal(true);
        });
    });

    // ─── Update Pool Tests ────────────────────────────────

    describe("Update Pool", function () {
        it("should update pool correctly on investment", async function () {
            const { pool, propertyContract, investor1, ethers } = await deployAndSetup();

            await pool.connect(propertyContract).updatePool(
                1,
                ethers.parseEther("10"),
                investor1.address
            );

            const info = await pool.getPoolInfo(1);
            expect(info.filledAmount).to.equal(ethers.parseEther("10"));
            expect(info.filledPercent).to.equal(10n);
            expect(info.investorCount).to.equal(1n);
        });

        it("should count unique investors correctly", async function () {
            const { pool, propertyContract, investor1, investor2, ethers } =
                await deployAndSetup();

            // investor1 invests twice
            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("10"), investor1.address
            );
            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("5"), investor1.address
            );

            // investor2 invests once
            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("20"), investor2.address
            );

            const info = await pool.getPoolInfo(1);
            // Should be 2 unique investors, not 3
            expect(info.investorCount).to.equal(2n);
        });

        it("should auto mark pool as FUNDED when goal reached", async function () {
            const { pool, propertyContract, investor1, ethers } = await deployAndSetup();

            // Invest full 100 MATIC
            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("100"), investor1.address
            );

            const status = await pool.getPoolStatus(1);
            // status 1 = FUNDED
            expect(status).to.equal(1n);
        });

        it("should NOT allow update on closed pool", async function () {
            const { pool, propertyContract, investor1, ethers } = await deployAndSetup();

            await pool.closePool(1);

            await expect(
                pool.connect(propertyContract).updatePool(
                    1, ethers.parseEther("10"), investor1.address
                )
            ).to.be.revertedWith("Pool is not open");
        });

        it("should NOT allow random user to update pool", async function () {
            const { pool, randomUser, investor1, ethers } = await deployAndSetup();

            await expect(
                pool.connect(randomUser).updatePool(
                    1, ethers.parseEther("10"), investor1.address
                )
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Close Pool Tests ─────────────────────────────────

    describe("Close Pool", function () {
        it("should allow admin to close pool", async function () {
            const { pool } = await deployAndSetup();

            await pool.closePool(1);

            const status = await pool.getPoolStatus(1);
            // status 2 = CLOSED
            expect(status).to.equal(2n);
        });

        it("should NOT allow closing already closed pool", async function () {
            const { pool } = await deployAndSetup();

            await pool.closePool(1);

            await expect(pool.closePool(1)).to.be.revertedWith("Already closed");
        });

        it("should NOT allow random user to close pool", async function () {
            const { pool, randomUser } = await deployAndSetup();

            await expect(
                pool.connect(randomUser).closePool(1)
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── View Function Tests ──────────────────────────────

    describe("View Functions", function () {
        it("should return isPoolOpen correctly", async function () {
            const { pool } = await deployAndSetup();

            expect(await pool.isPoolOpen(1)).to.equal(true);

            await pool.closePool(1);

            expect(await pool.isPoolOpen(1)).to.equal(false);
        });

        it("should revert getPoolInfo for non-existent pool", async function () {
            const { pool } = await deployPool();

            await expect(pool.getPoolInfo(99)).to.be.revertedWith("Pool not found");
        });

        it("should track filled percent correctly", async function () {
            const { pool, propertyContract, investor1, investor2, ethers } =
                await deployAndSetup();

            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("25"), investor1.address
            );
            await pool.connect(propertyContract).updatePool(
                1, ethers.parseEther("25"), investor2.address
            );

            const info = await pool.getPoolInfo(1);
            expect(info.filledPercent).to.equal(50n);
        });
    });

}); // closes OwnlyPool
