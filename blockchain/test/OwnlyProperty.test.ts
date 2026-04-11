import { expect } from "chai";
import { network } from "hardhat";

describe("OwnlyProperty", function () {

    // ─── Deploy Helper ────────────────────────────────────
    // Deploys all required contracts and wires them together

    async function deployAll() {
        const connection = await network.connect();
        const { ethers } = connection;

        const [owner, platformWallet, investor1, investor2, randomUser] =
            await ethers.getSigners();

        // 1. Deploy Mock INRC token (simulates real INRC stablecoin)
        const MockINRC = await ethers.getContractFactory("MockINRC");
        const inrc = await MockINRC.deploy();

        // 2. Deploy OwnlyValuation
        const OwnlyValuation = await ethers.getContractFactory("OwnlyValuation");
        const valuation = await OwnlyValuation.deploy();

        // 3. Deploy OwnlyProperty with all addresses
        //    platformFeeRate = 200 = 2%
        const OwnlyProperty = await ethers.getContractFactory("OwnlyProperty");
        const property = await OwnlyProperty.deploy(
            platformWallet.address,
            await valuation.getAddress(),
            await inrc.getAddress(),
            200n
        );

        // 4. Wire valuation → property contract
        await valuation.setPropertyContract(await property.getAddress());

        const provider = ethers.provider;

        return {
            property, valuation, inrc,
            owner, platformWallet, investor1, investor2, randomUser,
            ethers, provider
        };
    }

    // ─── Deploy + Create Property Helper ─────────────────
    // Creates a property with totalValue = 100 MATIC, 1000 tokens
    // NAV = 100 MATIC / 1000 = 0.1 MATIC per token

    async function deployWithProperty() {
        const result = await deployAll();
        const { property, ethers } = result;

        await property.createProperty(
            "Luxury Villa Mumbai",   // name
            "Bandra, Mumbai",        // location
            5n,                      // dbPropertyId (PostgreSQL link)
            ethers.parseEther("100"),// totalValue = 100 MATIC
            1000n,                   // totalTokens = 1000
            "LVM"                    // token symbol
        );

        return result;
    }

    // ─── Deploy + Property + Investments Helper ───────────
    // investor1 invests ~10 MATIC → gets ~98 tokens (after 2% fee)
    // investor2 invests ~20 MATIC → gets ~196 tokens (after 2% fee)

    async function deployWithInvestments() {
        const result = await deployWithProperty();
        const { property, investor1, investor2, ethers } = result;

        // NAV = 0.1 MATIC per token
        // Sending 10 MATIC: fee = 0.2, investment = 9.8, tokens = 9.8/0.1 = 98
        await property.connect(investor1).invest(1, {
            value: ethers.parseEther("10")
        });

        // Sending 20 MATIC: fee = 0.4, investment = 19.6, tokens = 19.6/0.1 = 196
        await property.connect(investor2).invest(1, {
            value: ethers.parseEther("20")
        });

        // Get token contract
        const prop = await property.getProperty(1);
        const tokenContract = await ethers.getContractAt(
            "OwnlyToken", prop.tokenAddress
        );

        return { ...result, tokenContract };
    }

    // ─── Deployment Tests ─────────────────────────────────

    describe("Deployment", function () {
        it("should set correct owner", async function () {
            const { property, owner } = await deployAll();
            expect(await property.owner()).to.equal(owner.address);
        });

        it("should set correct platform wallet", async function () {
            const { property, platformWallet } = await deployAll();
            expect(await property.platformWallet())
                .to.equal(platformWallet.address);
        });

        it("should set correct platform fee rate", async function () {
            const { property } = await deployAll();
            expect(await property.platformFeeRate()).to.equal(200n);
        });

        it("should set correct valuation contract", async function () {
            const { property, valuation } = await deployAll();
            expect(await property.valuationContract())
                .to.equal(await valuation.getAddress());
        });

        it("should set correct INRC token", async function () {
            const { property, inrc } = await deployAll();
            expect(await property.inrcToken())
                .to.equal(await inrc.getAddress());
        });
    });

    // ─── Create Property Tests ────────────────────────────

    describe("Create Property", function () {
        it("should create property with correct details", async function () {
            const { property, ethers } = await deployWithProperty();

            const prop = await property.getProperty(1);
            expect(prop.name).to.equal("Luxury Villa Mumbai");
            expect(prop.location).to.equal("Bandra, Mumbai");
            expect(prop.dbPropertyId).to.equal(5n);
            expect(prop.totalValue).to.equal(ethers.parseEther("100"));
            expect(prop.totalTokens).to.equal(1000n);
            expect(prop.isActive).to.equal(true);
            expect(prop.isSold).to.equal(false);
        });

        it("should deploy OwnlyToken for the property", async function () {
            const { property } = await deployWithProperty();

            const prop = await property.getProperty(1);
            expect(prop.tokenAddress).to.not.equal(
                "0x0000000000000000000000000000000000000000"
            );
        });

        it("should initialize property in valuation contract", async function () {
            const { property, valuation, ethers } = await deployWithProperty();

            const val = await valuation.getValuation(1);
            expect(val.exists).to.equal(true);
            expect(val.currentValue).to.equal(ethers.parseEther("100"));
            expect(val.dbPropertyId).to.equal(5n);
        });

        it("should increment propertyCount", async function () {
            const { property, ethers } = await deployWithProperty();
            expect(await property.propertyCount()).to.equal(1n);

            await property.createProperty(
                "Second Property", "Delhi",
                6n, ethers.parseEther("50"), 500n, "SP"
            );
            expect(await property.propertyCount()).to.equal(2n);
        });

        it("should NOT allow non-owner to create property", async function () {
            const { property, investor1, ethers } = await deployAll();

            await expect(
                property.connect(investor1).createProperty(
                    "Fake", "Nowhere", 1n,
                    ethers.parseEther("100"), 1000n, "FAKE"
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT create property with zero value", async function () {
            const { property } = await deployAll();

            await expect(
                property.createProperty(
                    "Bad Property", "Nowhere", 1n,
                    0n, 1000n, "BAD"
                )
            ).to.be.revertedWith("Value must be greater than 0");
        });

        it("should NOT create property with zero tokens", async function () {
            const { property, ethers } = await deployAll();

            await expect(
                property.createProperty(
                    "Bad Property", "Nowhere", 1n,
                    ethers.parseEther("100"), 0n, "BAD"
                )
            ).to.be.revertedWith("Tokens must be greater than 0");
        });
    });

    // ─── Investment Tests ─────────────────────────────────

    describe("Investment", function () {
        it("should mint tokens to investor after investment", async function () {
            const { property, investor1, ethers } = await deployWithProperty();

            await property.connect(investor1).invest(1, {
                value: ethers.parseEther("10")
            });

            const prop = await property.getProperty(1);
            const token = await ethers.getContractAt(
                "OwnlyToken", prop.tokenAddress
            );

            // 10 MATIC sent, 2% fee = 0.2, investment = 9.8
            // NAV = 0.1 MATIC, tokens = 9.8 / 0.1 = 98
            const balance = await token.balanceOf(investor1.address);
            expect(balance).to.equal(98n);
        });

        it("should send 2% platform fee to platform wallet", async function () {
            const { property, investor1, platformWallet, ethers } =
                await deployWithProperty();

            const balanceBefore = await ethers.provider.getBalance(
                platformWallet.address
            );

            await property.connect(investor1).invest(1, {
                value: ethers.parseEther("10")
            });

            const balanceAfter = await ethers.provider.getBalance(
                platformWallet.address
            );

            // 2% of 10 MATIC = 0.2 MATIC
            expect(balanceAfter - balanceBefore)
                .to.equal(ethers.parseEther("0.2"));
        });

        it("should update totalRaised after investment", async function () {
            const { property, investor1, ethers } = await deployWithProperty();

            await property.connect(investor1).invest(1, {
                value: ethers.parseEther("10")
            });

            const prop = await property.getProperty(1);
            // totalRaised = investmentAmount after fee = 9.8 MATIC
            expect(prop.totalRaised).to.equal(ethers.parseEther("9.8"));
        });

        it("should NOT allow investment below NAV price", async function () {
            const { property, investor1 } = await deployWithProperty();

            // NAV = 0.1 MATIC, sending less than that
            await expect(
                property.connect(investor1).invest(1, {
                    value: 1n // 1 wei — way below NAV
                })
            ).to.be.revertedWith("Below minimum investment");
        });

        it("should NOT allow investment exceeding funding goal", async function () {
            const { property, investor1, ethers } = await deployWithProperty();

            // totalValue = 100 MATIC, trying to invest 200
            await expect(
                property.connect(investor1).invest(1, {
                    value: ethers.parseEther("200")
                })
            ).to.be.revertedWith("Exceeds funding goal");
        });

        it("should NOT allow investment in inactive property", async function () {
            const { property, investor1, ethers } = await deployWithProperty();

            // Sell property first to make it inactive
            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await expect(
                property.connect(investor1).invest(1, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWith("Property not active");
        });

        it("should NOT allow investment in sold property", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await expect(
                property.connect(investor1).invest(1, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWith("Property not active");
        });

        it("should NOT allow investment on non-existent property", async function () {
            const { property, investor1, ethers } = await deployWithProperty();

            await expect(
                property.connect(investor1).invest(99, {
                    value: ethers.parseEther("10")
                })
            ).to.be.revertedWith("Property not found");
        });
    });

    // ─── Rent Distribution Tests (INRC) ───────────────────

    describe("Rent Distribution (INRC)", function () {
        it("should allow admin to deposit INRC rent", async function () {
            const { property, inrc, owner, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18); // 1000 INRC

            // Admin mints INRC and approves property contract
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);

            await property.distributeRent(1, rentAmount);

            // totalRentPerToken should be > 0
            const rentPerToken = await property.totalRentPerToken(1);
            expect(rentPerToken).to.be.greaterThan(0n);
        });

        it("should allow investor to claim INRC rent", async function () {
            const { property, inrc, owner, investor1, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);

            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            // investor1 has 98 tokens out of 294 total (98+196)
            // share = 98/294 * 1000 INRC ≈ 333.33 INRC
            const claimableBefore = await property.getClaimableRent(
                1, investor1.address
            );
            expect(claimableBefore).to.be.greaterThan(0n);

            // Claim rent
            const balanceBefore = await inrc.balanceOf(investor1.address);
            await property.connect(investor1).claimRent(1);
            const balanceAfter = await inrc.balanceOf(investor1.address);

            expect(balanceAfter - balanceBefore).to.equal(claimableBefore);
        });

        it("should distribute rent proportionally between investors", async function () {
            const { property, inrc, owner, investor1, investor2, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);

            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            const prop = await property.getProperty(1);
            const token = await ethers.getContractAt(
                "OwnlyToken", prop.tokenAddress
            );

            // Get actual token balances
            const tokens1 = await token.balanceOf(investor1.address);
            const tokens2 = await token.balanceOf(investor2.address);

            const rent1 = await property.getClaimableRent(1, investor1.address);
            const rent2 = await property.getClaimableRent(1, investor2.address);

            // Both investors should have claimable rent > 0
            expect(rent1).to.be.greaterThan(0n);
            expect(rent2).to.be.greaterThan(0n);

            // Both investors should have tokens > 0
            expect(tokens1).to.be.greaterThan(0n);
            expect(tokens2).to.be.greaterThan(0n);

            // Verify rent is proportional to token holdings
            // rent per token should be the same for both investors
            // rentPerToken1 = rent1 / tokens1
            // rentPerToken2 = rent2 / tokens2
            // Cross multiply: rent1 * tokens2 should ≈ rent2 * tokens1
            const side1 = rent1 * tokens2;
            const side2 = rent2 * tokens1;
            const larger = side1 > side2 ? side1 : side2;
            const diff = side1 > side2 ? side1 - side2 : side2 - side1;
            // Allow 5% tolerance for integer division rounding
            const tolerance = larger / 20n;
            expect(diff).to.be.lessThanOrEqual(tolerance);
        });

        it("should NOT allow double claiming rent", async function () {
            const { property, inrc, owner, investor1, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);

            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            // First claim works
            await property.connect(investor1).claimRent(1);

            // Second claim should fail
            await expect(
                property.connect(investor1).claimRent(1)
            ).to.be.revertedWith("Nothing to claim");
        });

        it("should accumulate rent across multiple distributions", async function () {
            const { property, inrc, owner, investor1, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);

            // First distribution
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            const rentAfterFirst = await property.getClaimableRent(
                1, investor1.address
            );

            // Second distribution
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            const rentAfterSecond = await property.getClaimableRent(
                1, investor1.address
            );

            // Should be double after two equal distributions
            // Allow 1 wei rounding tolerance from integer division
            const diff = rentAfterSecond > rentAfterFirst * 2n
                ? rentAfterSecond - rentAfterFirst * 2n
                : rentAfterFirst * 2n - rentAfterSecond;
            expect(diff).to.be.lessThanOrEqual(1n);
        });

        it("should NOT allow non-owner to distribute rent", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);

            await expect(
                property.connect(investor1).distributeRent(1, rentAmount)
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT distribute rent if no investors yet", async function () {
            const { property, inrc, owner, ethers } =
                await deployWithProperty();

            const rentAmount = ethers.parseUnits("1000", 18);

            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);

            await expect(
                property.distributeRent(1, rentAmount)
            ).to.be.revertedWith("No investors yet");
        });

        it("should NOT distribute zero rent", async function () {
            const { property } = await deployWithInvestments();

            await expect(
                property.distributeRent(1, 0n)
            ).to.be.revertedWith("Must send rental income");
        });

        it("should NOT distribute rent on sold property", async function () {
            const { property, inrc, owner, ethers } =
                await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            const rentAmount = ethers.parseUnits("1000", 18);
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);

            await expect(
                property.distributeRent(1, rentAmount)
            ).to.be.revertedWith("Property not active");
        });
    });

    // ─── Property Sale Tests ──────────────────────────────

    describe("Property Sale", function () {
        it("should allow admin to sell property", async function () {
            const { property, ethers } = await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            const prop = await property.getProperty(1);
            expect(prop.isSold).to.equal(true);
            expect(prop.isActive).to.equal(false);
            expect(prop.saleAmount).to.equal(ethers.parseEther("150"));
        });

        it("should NOT allow selling twice", async function () {
            const { property, ethers } = await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await expect(
                property.sellProperty(1, {
                    value: ethers.parseEther("200")
                })
            ).to.be.revertedWith("Property not active");
        });

        it("should NOT allow non-owner to sell", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            await expect(
                property.connect(investor1).sellProperty(1, {
                    value: ethers.parseEther("150")
                })
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT allow selling with zero amount", async function () {
            const { property } = await deployWithInvestments();

            await expect(
                property.sellProperty(1, { value: 0n })
            ).to.be.revertedWith("Must send sale amount");
        });
    });

    // ─── Claim Sale Proceeds Tests ────────────────────────

    describe("Claim Sale Proceeds (MATIC)", function () {
        it("should allow investor to claim proportional sale proceeds", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            // investor1 has 98 tokens out of 294 total
            // share = 98/1000 * 150 MATIC = 14.7 MATIC
            // Note: totalTokens in property struct = 1000 (original)
            const balanceBefore = await ethers.provider.getBalance(
                investor1.address
            );

            const tx = await property.connect(investor1).claimSaleProceeds(1);
            const receipt = await tx.wait();
            const gas = receipt!.gasUsed * receipt!.gasPrice;

            const balanceAfter = await ethers.provider.getBalance(
                investor1.address
            );

            const received = balanceAfter - balanceBefore + gas;
            expect(received).to.equal(ethers.parseEther("14.7"));
        });

        it("should NOT allow claiming sale proceeds before property is sold", async function () {
            const { property, investor1 } = await deployWithInvestments();

            await expect(
                property.connect(investor1).claimSaleProceeds(1)
            ).to.be.revertedWith("Property not sold yet");
        });

        it("should NOT allow double claiming sale proceeds", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            await property.connect(investor1).claimSaleProceeds(1);

            await expect(
                property.connect(investor1).claimSaleProceeds(1)
            ).to.be.revertedWith("No tokens held");
            // tokens transferred to platform on first claim
            // so second claim finds zero tokens
        });

        it("should transfer tokens to platform wallet on claim", async function () {
            const { property, investor1, platformWallet, ethers } =
                await deployWithInvestments();

            const prop = await property.getProperty(1);
            const token = await ethers.getContractAt(
                "OwnlyToken", prop.tokenAddress
            );

            await property.sellProperty(1, {
                value: ethers.parseEther("150")
            });

            const platformTokensBefore = await token.balanceOf(
                platformWallet.address
            );

            await property.connect(investor1).claimSaleProceeds(1);

            const platformTokensAfter = await token.balanceOf(
                platformWallet.address
            );

            // investor1's 98 tokens should now be at platform wallet
            expect(platformTokensAfter - platformTokensBefore).to.equal(98n);
        });
    });

    // ─── View Functions Tests ─────────────────────────────

    describe("View Functions", function () {
        it("should return correct investor info", async function () {
            const { property, investor1, ethers } =
                await deployWithInvestments();

            const info = await property.getInvestorInfo(1, investor1.address);

            // tokensOwned = 98
            expect(info.tokensOwned).to.equal(98n);

            // ownershipPercent = 98/1000 * 10000 = 980 (9.8%)
            expect(info.ownershipPercent).to.equal(980n);

            // no rent distributed yet
            expect(info.claimableRentINRC).to.equal(0n);

            // currentNAV should be > 0
            expect(info.currentNAV).to.be.greaterThan(0n);
        });

        it("should return claimable rent in investor info", async function () {
            const { property, inrc, owner, investor1, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            const info = await property.getInvestorInfo(1, investor1.address);
            expect(info.claimableRentINRC).to.be.greaterThan(0n);
        });

        it("should return correct property details", async function () {
            const { property, ethers } = await deployWithProperty();

            const prop = await property.getProperty(1);
            expect(prop.name).to.equal("Luxury Villa Mumbai");
            expect(prop.dbPropertyId).to.equal(5n);
            expect(prop.totalValue).to.equal(ethers.parseEther("100"));
        });

        it("should return zero claimable rent for non-investor", async function () {
            const { property, inrc, owner, randomUser, ethers } =
                await deployWithInvestments();

            const rentAmount = ethers.parseUnits("1000", 18);
            await inrc.mint(owner.address, rentAmount);
            await inrc.approve(await property.getAddress(), rentAmount);
            await property.distributeRent(1, rentAmount);

            const claimable = await property.getClaimableRent(
                1, randomUser.address
            );
            expect(claimable).to.equal(0n);
        });
    });

    // ─── Admin Setup Tests ────────────────────────────────

    describe("Admin Setup Functions", function () {
        it("should allow owner to update valuation contract", async function () {
            const { property, randomUser } = await deployAll();

            await property.setValuationContract(randomUser.address);
            expect(await property.valuationContract())
                .to.equal(randomUser.address);
        });

        it("should allow owner to update INRC token", async function () {
            const { property, randomUser } = await deployAll();

            await property.setInrcToken(randomUser.address);
            expect(await property.inrcToken()).to.equal(randomUser.address);
        });

        it("should allow owner to update platform wallet", async function () {
            const { property, randomUser } = await deployAll();

            await property.setPlatformWallet(randomUser.address);
            expect(await property.platformWallet())
                .to.equal(randomUser.address);
        });

        it("should NOT allow non-owner to update valuation", async function () {
            const { property, randomUser } = await deployAll();

            await expect(
                property.connect(randomUser).setValuationContract(
                    randomUser.address
                )
            ).to.be.revertedWith("Not authorized");
        });

        it("should NOT allow non-owner to update platform wallet", async function () {
            const { property, randomUser } = await deployAll();

            await expect(
                property.connect(randomUser).setPlatformWallet(
                    randomUser.address
                )
            ).to.be.revertedWith("Not authorized");
        });
    });

}); // closes OwnlyProperty
