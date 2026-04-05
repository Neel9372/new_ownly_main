import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyExitWindow", function () {

    async function deployAll() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [admin, platformWallet, investor1, investor2, randomUser] =
            await ethers.getSigners();

        const OwnlyTreasury = await ethers.getContractFactory("OwnlyTreasury");
        const treasury = await OwnlyTreasury.deploy(platformWallet.address);

        const OwnlyExitWindow = await ethers.getContractFactory("OwnlyExitWindow");
        const exitWindow = await OwnlyExitWindow.deploy(await treasury.getAddress());

        await treasury.setExitWindowContract(await exitWindow.getAddress());

        const OwnlyToken = await ethers.getContractFactory("OwnlyToken");
        const token = await OwnlyToken.deploy(
            "Test Property Token",
            "TPT",
            admin.address,
            1n
        );

        await token.mint(investor1.address, 1000n);
        await token.mint(investor2.address, 500n);

        await treasury.deposit(1, { value: ethers.parseEther("50") });

        const provider = ethers.provider;

        return { exitWindow, treasury, token, admin, platformWallet, investor1, investor2, randomUser, ethers, provider };
    }

    async function fastForward2Years(provider: any) {
        const TWO_YEARS = 2 * 365 * 24 * 60 * 60;
        await provider.send("evm_increaseTime", [TWO_YEARS]);
        await provider.send("evm_mine", []);
    }

    async function fastForward(provider: any, seconds: number) {
        await provider.send("evm_increaseTime", [seconds]);
        await provider.send("evm_mine", []);
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set correct admin", async function () {
            const { exitWindow, admin } = await deployAll();
            expect(await exitWindow.admin()).to.equal(admin.address);
        });

        it("should set correct treasury address", async function () {
            const { exitWindow, treasury } = await deployAll();
            expect(await exitWindow.treasury()).to.equal(await treasury.getAddress());
        });

        it("should NOT deploy with zero treasury address", async function () {
            const connection = await network.connect();
            const { ethers } = connection;

            const OwnlyExitWindow = await ethers.getContractFactory("OwnlyExitWindow");
            await expect(
                OwnlyExitWindow.deploy(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid treasury address");
        });
    });

    // ─── Record Timestamp Tests ───────────────────────────

    describe("Record Investment Timestamp", function () {
        it("should record investor timestamp", async function () {
            const { exitWindow, investor1 } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);

            const ts = await exitWindow.investmentTimestamp(1, investor1.address);
            expect(ts).to.be.greaterThan(0n);
        });

        it("should NOT overwrite existing timestamp", async function () {
            const { exitWindow, investor1, provider } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            const ts1 = await exitWindow.investmentTimestamp(1, investor1.address);

            await fastForward(provider, 100);

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            const ts2 = await exitWindow.investmentTimestamp(1, investor1.address);

            expect(ts1).to.equal(ts2);
        });

        it("should NOT allow random user to record timestamp", async function () {
            const { exitWindow, randomUser, investor1 } = await deployAll();

            await expect(
                exitWindow.connect(randomUser).recordInvestmentTimestamp(1, investor1.address)
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Open/Close Window Tests ──────────────────────────

    describe("Open and Close Exit Window", function () {
        it("should open exit window correctly", async function () {
            const { exitWindow, ethers } = await deployAll();

            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            const info = await exitWindow.getExitWindowInfo(1);
            expect(info.isOpen).to.equal(true);
            expect(info.navAtOpen).to.equal(ethers.parseEther("0.1"));
            expect(info.daysRemaining).to.equal(30n);
        });

        it("should NOT open window if already open", async function () {
            const { exitWindow, ethers } = await deployAll();

            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            await expect(
                exitWindow.openExitWindow(1, ethers.parseEther("0.1"))
            ).to.be.revertedWith("Window already open");
        });

        it("should NOT open window with zero NAV", async function () {
            const { exitWindow } = await deployAll();

            await expect(
                exitWindow.openExitWindow(1, 0n)
            ).to.be.revertedWith("NAV must be greater than 0");
        });

        it("should close exit window correctly", async function () {
            const { exitWindow, ethers } = await deployAll();

            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));
            await exitWindow.closeExitWindow(1);

            const info = await exitWindow.getExitWindowInfo(1);
            expect(info.isOpen).to.equal(false);
        });

        it("should NOT close window if not open", async function () {
            const { exitWindow } = await deployAll();

            await expect(
                exitWindow.closeExitWindow(1)
            ).to.be.revertedWith("Window not open");
        });

        it("should NOT allow random user to open window", async function () {
            const { exitWindow, randomUser, ethers } = await deployAll();

            await expect(
                exitWindow.connect(randomUser).openExitWindow(1, ethers.parseEther("0.1"))
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Request Exit Tests ───────────────────────────────

    describe("Request Exit", function () {
        it("should NOT allow exit if window not open", async function () {
            const { exitWindow, token, investor1, provider } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            // Fast forward 2 years — window is NOT open
            await fastForward2Years(provider);

            await expect(
                exitWindow.connect(investor1).requestExit(
                    1, 100n, await token.getAddress()
                )
            ).to.be.revertedWith("Exit window not open");
        });

        it("should NOT allow exit if 2 year hold not met", async function () {
            const { exitWindow, token, investor1, provider, ethers } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);

            // Fast forward only 1 year — hold not met yet
            await fastForward(provider, 365 * 24 * 60 * 60);

            // Open window AFTER fast forward so it doesn't expire
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            await expect(
                exitWindow.connect(investor1).requestExit(
                    1, 100n, await token.getAddress()
                )
            ).to.be.revertedWith("Minimum 2 year hold period not met");
        });

        it("should NOT allow exit if no investment timestamp recorded", async function () {
            const { exitWindow, token, investor1, provider, ethers } = await deployAll();

            // Fast forward 2 years, THEN open window
            await fastForward2Years(provider);
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            // No timestamp recorded for investor1
            await expect(
                exitWindow.connect(investor1).requestExit(
                    1, 100n, await token.getAddress()
                )
            ).to.be.revertedWith("No investment found");
        });

        it("should NOT allow exit exceeding 25% of holdings", async function () {
            const { exitWindow, token, investor1, provider, ethers } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);

            // Fast forward 2 years, THEN open window
            await fastForward2Years(provider);
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            // investor1 has 1000 tokens, 25% = 250 max, requesting 300
            await expect(
                exitWindow.connect(investor1).requestExit(
                    1, 300n, await token.getAddress()
                )
            ).to.be.revertedWith("Exceeds 25% max exit per window");
        });

        it("should allow valid exit request after 2 years", async function () {
            const { exitWindow, token, investor1, provider, ethers } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);

            // Fast forward 2 years, THEN open window
            await fastForward2Years(provider);
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            // investor1 has 1000 tokens, requesting 200 (20% — within 25% limit)
            await exitWindow.connect(investor1).requestExit(
                1, 200n, await token.getAddress()
            );

            const info = await exitWindow.getExitWindowInfo(1);
            expect(info.queueSize).to.equal(1n);
            expect(info.totalTokensQueued).to.equal(200n);
        });

        it("should NOT allow exceeding 25% across multiple requests in same window", async function () {
            const { exitWindow, token, investor1, provider, ethers } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);

            // Fast forward 2 years, THEN open window
            await fastForward2Years(provider);
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            // First request: 200 tokens (20%)
            await exitWindow.connect(investor1).requestExit(
                1, 200n, await token.getAddress()
            );

            // Second request: 100 more (total 30% — should fail)
            await expect(
                exitWindow.connect(investor1).requestExit(
                    1, 100n, await token.getAddress()
                )
            ).to.be.revertedWith("Exceeds 25% max exit per window");
        });
    });

    // ─── canExit Tests ────────────────────────────────────

    describe("canExit", function () {
        it("should return false if no timestamp recorded", async function () {
            const { exitWindow, investor1 } = await deployAll();
            expect(await exitWindow.canExit(1, investor1.address)).to.equal(false);
        });

        it("should return false before 2 years", async function () {
            const { exitWindow, investor1, provider } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            await fastForward(provider, 365 * 24 * 60 * 60); // 1 year

            expect(await exitWindow.canExit(1, investor1.address)).to.equal(false);
        });

        it("should return true after 2 years", async function () {
            const { exitWindow, investor1, provider } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            await fastForward2Years(provider);

            expect(await exitWindow.canExit(1, investor1.address)).to.equal(true);
        });
    });

    // ─── Get Exit Queue Tests ─────────────────────────────

    describe("Get Exit Queue", function () {
        it("should return empty queue initially", async function () {
            const { exitWindow } = await deployAll();
            const queue = await exitWindow.getExitQueue(1);
            expect(queue.length).to.equal(0);
        });

        it("should return queue with requests after investors request exit", async function () {
            const { exitWindow, token, investor1, investor2, provider, ethers } = await deployAll();

            await exitWindow.recordInvestmentTimestamp(1, investor1.address);
            await exitWindow.recordInvestmentTimestamp(1, investor2.address);

            // Fast forward 2 years, THEN open window
            await fastForward2Years(provider);
            await exitWindow.openExitWindow(1, ethers.parseEther("0.1"));

            await exitWindow.connect(investor1).requestExit(1, 100n, await token.getAddress());
            await exitWindow.connect(investor2).requestExit(1, 50n, await token.getAddress());

            const queue = await exitWindow.getExitQueue(1);
            expect(queue.length).to.equal(2);
            expect(queue[0].investor).to.equal(investor1.address);
            expect(queue[0].tokenAmount).to.equal(100n);
            expect(queue[1].investor).to.equal(investor2.address);
            expect(queue[1].tokenAmount).to.equal(50n);
        });
    });

}); // closes OwnlyExitWindow
