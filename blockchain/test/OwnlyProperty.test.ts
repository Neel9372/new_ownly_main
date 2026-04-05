import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyProperty", function () {

    async function deployContract() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [owner, investor1, investor2] = await ethers.getSigners();
        
        const OwnlyProperty = await ethers.getContractFactory("OwnlyProperty");
        const property = await OwnlyProperty.deploy();
        
        return { property, owner, investor1, investor2, ethers };
    }

    // Helper: create property + invest
    async function deployWithInvestment() {
        const { property, owner, investor1, investor2, ethers } = await deployContract();

        await property.createProperty(
            "Luxury Villa Mumbai", "Bandra, Mumbai",
            ethers.parseEther("100"), 1000n, "LVM"
        );

        // investor1 invests 10 MATIC → gets 100 tokens (10%)
        await property.connect(investor1).invest(1, {
            value: ethers.parseEther("10")
        });

        // investor2 invests 20 MATIC → gets 200 tokens (20%)
        await property.connect(investor2).invest(1, {
            value: ethers.parseEther("20")
        });

        // Get token contract
        const prop = await property.getProperty(1);
        const tokenContract = await ethers.getContractAt("OwnlyToken", prop.tokenAddress);

        return { property, owner, investor1, investor2, ethers, tokenContract };
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set the correct owner", async function () {
            const { property, owner } = await deployContract();
            expect(await property.owner()).to.equal(owner.address);
        });
    });

    // ─── Create Property Tests ────────────────────────────

    describe("Create Property", function () {
        it("should create a property with correct details", async function () {
            const { property, ethers } = await deployContract();
            
            await property.createProperty(
                "Luxury Villa Mumbai",
                "Bandra, Mumbai",
                ethers.parseEther("100"),
                1000n,
                "LVM"
            );
            
            const prop = await property.getProperty(1);
            expect(prop.name).to.equal("Luxury Villa Mumbai");
            expect(prop.location).to.equal("Bandra, Mumbai");
            expect(prop.isActive).to.equal(true);
            expect(prop.totalTokens).to.equal(1000n);
        });

        it("should NOT allow non-owner to create property", async function () {
            const { property, investor1, ethers } = await deployContract();
            
            await expect(
                property.connect(investor1).createProperty(
                    "Fake Property", "Nowhere", 
                    ethers.parseEther("100"), 1000n, "FAKE"
                )
            ).to.be.revertedWith("Not authorized");
        });
    });

    // ─── Investment Tests ─────────────────────────────────

    describe("Investment", function () {
        it("should allow investment and mint tokens", async function () {
            const { property, investor1, ethers } = await deployContract();
            
            await property.createProperty(
                "Luxury Villa Mumbai", "Bandra, Mumbai",
                ethers.parseEther("100"), 1000n, "LVM"
            );
            
            await property.connect(investor1).invest(1, {
                value: ethers.parseEther("10")
            });
            
            const prop = await property.getProperty(1);
            expect(prop.totalRaised).to.equal(ethers.parseEther("10"));

            const tokenContract = await ethers.getContractAt("OwnlyToken", prop.tokenAddress);
            const balance = await tokenContract.balanceOf(investor1.address);
            expect(balance).to.equal(100n);
        });

        it("should NOT allow investment exceeding funding goal", async function () {
            const { property, investor1, ethers } = await deployContract();
            
            await property.createProperty(
                "Small Property", "Delhi",
                ethers.parseEther("10"), 100n, "SPD"
            );
            
            await expect(
                property.connect(investor1).invest(1, {
                    value: ethers.parseEther("20")
                })
            ).to.be.revertedWith("Exceeds funding goal");
        });
    });

    // ─── Rental Income Tests ──────────────────────────────

    describe("Rental Income Distribution", function () {
        it("should allow owner to deposit rental income", async function () {
            const { property, ethers } = await deployWithInvestment();

            await property.distributeRent(1, {
                value: ethers.parseEther("10")
            });

            const prop = await property.getProperty(1);
            expect(prop.totalRentDeposited).to.equal(ethers.parseEther("10"));
        });

        it("should NOT allow non-owner to deposit rent", async function () {
            const { property, investor1, ethers } = await deployWithInvestment();

            await expect(
                property.connect(investor1).distributeRent(1, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWith("Not authorized");
        });

        it("should allow investor to claim rental returns", async function () {
            const { property, investor1, ethers } = await deployWithInvestment();

            await property.distributeRent(1, {
                value: ethers.parseEther("10")
            });

            const balanceBefore = await ethers.provider.getBalance(investor1.address);

            const tx = await property.connect(investor1).claimReturns(1);
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(investor1.address);
            const received = balanceAfter - balanceBefore + gasUsed;

            expect(received).to.equal(ethers.parseEther("1"));
        });

        it("should NOT allow double-claiming", async function () {
            const { property, investor1, ethers } = await deployWithInvestment();

            await property.distributeRent(1, {
                value: ethers.parseEther("10")
            });

            await property.connect(investor1).claimReturns(1);

            await expect(
                property.connect(investor1).claimReturns(1)
            ).to.be.revertedWith("Nothing to claim");
        });
    });

    // ─── Property Sale Tests ──────────────────────────────

    describe("Property Sale & Appreciation", function () {
        it("should allow owner to sell property", async function () {
            const { property, ethers } = await deployWithInvestment();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            const prop = await property.getProperty(1);
            expect(prop.isSold).to.equal(true);
            expect(prop.isActive).to.equal(false);
            expect(prop.saleAmount).to.equal(ethers.parseEther("150"));
        });

        it("should NOT allow selling twice", async function () {
            const { property, ethers } = await deployWithInvestment();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await expect(
                property.sellProperty(1, {
                    value: ethers.parseEther("200")
                })
            ).to.be.revertedWith("Property not active");
        });

        it("should distribute sale proceeds proportionally", async function () {
            const { property, investor1, investor2, ethers } = await deployWithInvestment();

            await property.distributeRent(1, {
                value: ethers.parseEther("5")
            });

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            // Total pool = 5 (rent) + 150 (sale) = 155 MATIC
            // investor1 has 100/1000 tokens (10%) → 15.5 MATIC
            const balance1Before = await ethers.provider.getBalance(investor1.address);
            const tx1 = await property.connect(investor1).claimReturns(1);
            const receipt1 = await tx1.wait();
            const gas1 = receipt1!.gasUsed * receipt1!.gasPrice;
            const balance1After = await ethers.provider.getBalance(investor1.address);
            const received1 = balance1After - balance1Before + gas1;
            expect(received1).to.equal(ethers.parseEther("15.5"));

            // investor2 has 200/1000 tokens (20%) → 31 MATIC
            const balance2Before = await ethers.provider.getBalance(investor2.address);
            const tx2 = await property.connect(investor2).claimReturns(1);
            const receipt2 = await tx2.wait();
            const gas2 = receipt2!.gasUsed * receipt2!.gasPrice;
            const balance2After = await ethers.provider.getBalance(investor2.address);
            const received2 = balance2After - balance2Before + gas2;
            expect(received2).to.equal(ethers.parseEther("31"));
        });

        it("should NOT allow investment after property is sold", async function () {
            const { property, investor1, ethers } = await deployWithInvestment();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await expect(
                property.connect(investor1).invest(1, {
                    value: ethers.parseEther("5")
                })
            ).to.be.revertedWith("Property not active");
        });
    });

    // ─── OwnlyToken Feature Tests ─────────────────────────

    describe("OwnlyToken — Transfer Lock & Burn", function () {
        it("should store propertyId correctly", async function () {
            const { tokenContract } = await deployWithInvestment();
            expect(await tokenContract.getPropertyId()).to.equal(1n);
        });

        it("should mint tokens even when locked (default)", async function () {
            const { tokenContract, investor1 } = await deployWithInvestment();

            // Tokens are locked by default, but minting still worked in deployWithInvestment
            expect(await tokenContract.isLocked()).to.equal(true);
            const balance = await tokenContract.balanceOf(investor1.address);
            expect(balance).to.equal(100n);
        });

        it("should BLOCK transfer between investors when locked", async function () {
            const { tokenContract, investor1, investor2 } = await deployWithInvestment();

            // Tokens locked by default
            expect(await tokenContract.isLocked()).to.equal(true);

            // investor1 tries to transfer tokens to investor2 — should FAIL
            await expect(
                tokenContract.connect(investor1).transfer(investor2.address, 10n)
            ).to.be.revertedWith("Tokens locked - not in exit window");
        });

        it("should ALLOW transfer between investors when unlocked", async function () {
            const { property, tokenContract, investor1, investor2, ethers } = await deployWithInvestment();

            // We need to unlock via property contract
            // For now, we'll test by calling setTransferLock from the property contract
            // Since there's no unlock function in OwnlyProperty yet, we test the token directly
            // by deploying a standalone token where WE are the propertyContract

            const connection = await network.connect();
            const { ethers: eth } = connection;
            const [deployer, user1, user2] = await eth.getSigners();

            const OwnlyToken = await eth.getContractFactory("OwnlyToken");
            const token = await OwnlyToken.deploy("Test Token", "TST", deployer.address, 1n);

            // Mint some tokens to user1
            await token.mint(user1.address, 100n);

            // Locked by default — transfer should fail
            await expect(
                token.connect(user1).transfer(user2.address, 10n)
            ).to.be.revertedWith("Tokens locked - not in exit window");

            // Unlock transfers
            await token.setTransferLock(false);

            // Now transfer should work
            await token.connect(user1).transfer(user2.address, 10n);
            expect(await token.balanceOf(user1.address)).to.equal(90n);
            expect(await token.balanceOf(user2.address)).to.equal(10n);
        });

        it("should allow burn even when locked", async function () {
            const connection = await network.connect();
            const { ethers: eth } = connection;
            const [deployer, user1] = await eth.getSigners();

            const OwnlyToken = await eth.getContractFactory("OwnlyToken");
            const token = await OwnlyToken.deploy("Test Token", "TST", deployer.address, 1n);

            // Mint tokens
            await token.mint(user1.address, 100n);
            expect(await token.balanceOf(user1.address)).to.equal(100n);

            // Burn should work even though tokens are locked
            expect(await token.isLocked()).to.equal(true);
            await token.burn(user1.address, 30n);
            expect(await token.balanceOf(user1.address)).to.equal(70n);
        });

        it("should NOT allow non-propertyContract to mint", async function () {
            const { tokenContract, investor1 } = await deployWithInvestment();

            await expect(
                tokenContract.connect(investor1).mint(investor1.address, 1000n)
            ).to.be.revertedWith("Only property contract can call this");
        });

        it("should NOT allow non-propertyContract to burn", async function () {
            const { tokenContract, investor1 } = await deployWithInvestment();

            await expect(
                tokenContract.connect(investor1).burn(investor1.address, 10n)
            ).to.be.revertedWith("Only property contract can call this");
        });
    });
});
