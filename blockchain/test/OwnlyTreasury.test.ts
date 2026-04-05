import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyTreasury", function () {

    async function deployTreasury() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [admin, platformWallet, propertyContract, exitWindow, investor1, randomUser] =
            await ethers.getSigners();

        const OwnlyTreasury = await ethers.getContractFactory("OwnlyTreasury");
        const treasury = await OwnlyTreasury.deploy(platformWallet.address);

        return { treasury, admin, platformWallet, propertyContract, exitWindow, investor1, randomUser, ethers };
    }

    async function deployAndSetup() {
        const { treasury, admin, platformWallet, propertyContract, exitWindow, investor1, randomUser, ethers } =
            await deployTreasury();

        await treasury.setPropertyContract(propertyContract.address);
        await treasury.setExitWindowContract(exitWindow.address);

        return { treasury, admin, platformWallet, propertyContract, exitWindow, investor1, randomUser, ethers };
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set correct admin", async function () {
            const { treasury, admin } = await deployTreasury();
            expect(await treasury.admin()).to.equal(admin.address);
        });

        it("should set correct platform wallet", async function () {
            const { treasury, platformWallet } = await deployTreasury();
            expect(await treasury.platformWallet()).to.equal(platformWallet.address);
        });

        it("should start with zero reserve balance", async function () {
            const { treasury } = await deployTreasury();
            expect(await treasury.getReserveBalance()).to.equal(0n);
        });

        it("should NOT deploy with zero platform wallet", async function () {
            const connection = await network.connect();
            const { ethers } = connection;

            const OwnlyTreasury = await ethers.getContractFactory("OwnlyTreasury");
            await expect(
                OwnlyTreasury.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid platform wallet");
        });
    });

    // ─── Deposit Tests ────────────────────────────────────

    describe("Deposit", function () {
        it("should accept deposit from property contract", async function () {
            const { treasury, propertyContract, ethers } = await deployAndSetup();

            await treasury.connect(propertyContract).deposit(1, {
                value: ethers.parseEther("2")
            });

            expect(await treasury.getReserveBalance()).to.equal(ethers.parseEther("2"));
            expect(await treasury.getContributionByProperty(1))
                .to.equal(ethers.parseEther("2"));
        });

        it("should accept deposit from admin", async function () {
            const { treasury, ethers } = await deployAndSetup();

            await treasury.deposit(1, { value: ethers.parseEther("5") });

            expect(await treasury.getReserveBalance()).to.equal(ethers.parseEther("5"));
        });

        it("should accumulate deposits from multiple properties", async function () {
            const { treasury, propertyContract, ethers } = await deployAndSetup();

            await treasury.connect(propertyContract).deposit(1, {
                value: ethers.parseEther("2")
            });
            await treasury.connect(propertyContract).deposit(2, {
                value: ethers.parseEther("3")
            });

            expect(await treasury.getReserveBalance()).to.equal(ethers.parseEther("5"));
            expect(await treasury.getContributionByProperty(1))
                .to.equal(ethers.parseEther("2"));
            expect(await treasury.getContributionByProperty(2))
                .to.equal(ethers.parseEther("3"));
        });

        it("should NOT allow deposit with zero value", async function () {
            const { treasury, propertyContract } = await deployAndSetup();

            await expect(
                treasury.connect(propertyContract).deposit(1, { value: 0n })
            ).to.be.revertedWith("Must send MATIC");
        });

        it("should NOT allow random user to deposit", async function () {
            const { treasury, randomUser, ethers } = await deployAndSetup();

            await expect(
                treasury.connect(randomUser).deposit(1, {
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Pay Exiting Investor Tests ───────────────────────

    describe("Pay Exiting Investor", function () {
        it("should pay exiting investor from reserve", async function () {
            const { treasury, exitWindow, investor1, ethers } = await deployAndSetup();

            // Fund the treasury first
            await treasury.deposit(1, { value: ethers.parseEther("10") });

            const balanceBefore = await ethers.provider.getBalance(investor1.address);

            await treasury.connect(exitWindow).payExitingInvestor(
                investor1.address,
                ethers.parseEther("5")
            );

            const balanceAfter = await ethers.provider.getBalance(investor1.address);
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("5"));
            expect(await treasury.getReserveBalance()).to.equal(ethers.parseEther("5"));
        });

        it("should NOT pay if insufficient reserve", async function () {
            const { treasury, exitWindow, investor1, ethers } = await deployAndSetup();

            // Only 1 MATIC in treasury
            await treasury.deposit(1, { value: ethers.parseEther("1") });

            await expect(
                treasury.connect(exitWindow).payExitingInvestor(
                    investor1.address,
                    ethers.parseEther("5")
                )
            ).to.be.revertedWith("Insufficient reserve balance");
        });

        it("should NOT allow random user to pay investor", async function () {
            const { treasury, randomUser, investor1, ethers } = await deployAndSetup();

            await treasury.deposit(1, { value: ethers.parseEther("10") });

            await expect(
                treasury.connect(randomUser).payExitingInvestor(
                    investor1.address,
                    ethers.parseEther("5")
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT pay zero amount", async function () {
            const { treasury, exitWindow, investor1 } = await deployAndSetup();

            await expect(
                treasury.connect(exitWindow).payExitingInvestor(investor1.address, 0n)
            ).to.be.revertedWith("Amount must be greater than 0");
        });
    });

    // ─── Platform Token Tests ─────────────────────────────

    describe("Platform Tokens", function () {
        it("should record tokens received from exiting investor", async function () {
            const { treasury, exitWindow, investor1 } = await deployAndSetup();

            await treasury.connect(exitWindow).receiveTokens(1, 100n, investor1.address);

            expect(await treasury.getPlatformTokens(1)).to.equal(100n);
        });

        it("should accumulate platform tokens across multiple exits", async function () {
            const { treasury, exitWindow, investor1 } = await deployAndSetup();

            await treasury.connect(exitWindow).receiveTokens(1, 100n, investor1.address);
            await treasury.connect(exitWindow).receiveTokens(1, 50n, investor1.address);

            expect(await treasury.getPlatformTokens(1)).to.equal(150n);
        });

        it("should allow admin to resell platform tokens", async function () {
            const { treasury, exitWindow, investor1, randomUser } = await deployAndSetup();

            await treasury.connect(exitWindow).receiveTokens(1, 100n, investor1.address);

            await treasury.resellPlatformTokens(1, randomUser.address, 60n);

            expect(await treasury.getPlatformTokens(1)).to.equal(40n);
        });

        it("should NOT resell more tokens than platform holds", async function () {
            const { treasury, exitWindow, investor1, randomUser } = await deployAndSetup();

            await treasury.connect(exitWindow).receiveTokens(1, 50n, investor1.address);

            await expect(
                treasury.resellPlatformTokens(1, randomUser.address, 100n)
            ).to.be.revertedWith("Not enough platform tokens");
        });

        it("should NOT allow zero token receive", async function () {
            const { treasury, exitWindow, investor1 } = await deployAndSetup();

            await expect(
                treasury.connect(exitWindow).receiveTokens(1, 0n, investor1.address)
            ).to.be.revertedWith("Token amount must be greater than 0");
        });

        it("should NOT allow random user to receive tokens", async function () {
            const { treasury, randomUser, investor1 } = await deployAndSetup();

            await expect(
                treasury.connect(randomUser).receiveTokens(1, 100n, investor1.address)
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Admin Tests ──────────────────────────────────────

    describe("Admin Controls", function () {
        it("should allow admin to update platform wallet", async function () {
            const { treasury, randomUser } = await deployAndSetup();

            await treasury.setPlatformWallet(randomUser.address);
            expect(await treasury.platformWallet()).to.equal(randomUser.address);
        });

        it("should NOT allow random user to update platform wallet", async function () {
            const { treasury, randomUser } = await deployAndSetup();

            await expect(
                treasury.connect(randomUser).setPlatformWallet(randomUser.address)
            ).to.be.revertedWith("Not authorized");
        });

        it("should accept direct MATIC via receive()", async function () {
            const { treasury, admin, ethers } = await deployAndSetup();

            await admin.sendTransaction({
                to: await treasury.getAddress(),
                value: ethers.parseEther("3")
            });

            expect(await treasury.getReserveBalance()).to.equal(ethers.parseEther("3"));
        });
    });

}); // closes OwnlyTreasury
