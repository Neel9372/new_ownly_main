// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OwnlyToken.sol";
import "./OwnlyValuation.sol";

// INRC/ARC stablecoin interface
// Same interface works for INRC now
// and ARC when it launches
interface IINRC {
    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract OwnlyProperty {

    // ─── State Variables ──────────────────────────────────

    address public owner;
    address public platformWallet;
    address public valuationContract;
    address public inrcToken;

    uint256 public platformFeeRate; // 200 = 2%
    uint256 public propertyCount;

    // ─── Structs ──────────────────────────────────────────

    struct Property {
        string name;
        string location;
        uint256 dbPropertyId;       // Links to PostgreSQL
        uint256 totalValue;         // Initial property value
        uint256 totalTokens;        // Total tokens created
        uint256 totalRaised;        // Total MATIC raised
        address tokenAddress;       // OwnlyToken contract
        bool isActive;
        bool isSold;
        uint256 saleAmount;         // MATIC from property sale
        uint256 createdAt;          // For 2yr minimum hold check
    }

    // ─── Rent Distribution (INRC Claimable Pool) ──────────

    // Total INRC rent per token accumulated (scaled by 1e18)
    mapping(uint256 => uint256) public totalRentPerToken;

    // Track how much rent per token each investor has claimed
    mapping(uint256 => mapping(address => uint256))
        public rentPerTokenClaimed;

    // ─── Sale Proceeds (MATIC) ────────────────────────────

    // Track sale proceeds claimed per investor
    mapping(uint256 => mapping(address => uint256))
        public saleClaimedReturns;

    // ─── Properties ───────────────────────────────────────

    mapping(uint256 => Property) public properties;

    // ─── Events ───────────────────────────────────────────

    event PropertyCreated(
        uint256 indexed id,
        string name,
        address tokenAddress,
        uint256 dbPropertyId
    );
    event Invested(
        uint256 indexed propertyId,
        address investor,
        uint256 maticAmount,
        uint256 tokens,
        uint256 platformFee
    );
    event RentDeposited(
        uint256 indexed propertyId,
        uint256 inrcAmount,
        uint256 inrcPerToken
    );
    event RentClaimed(
        uint256 indexed propertyId,
        address investor,
        uint256 inrcAmount
    );
    event PropertySold(
        uint256 indexed propertyId,
        uint256 saleAmount
    );
    event SaleProceedsClaimed(
        uint256 indexed propertyId,
        address investor,
        uint256 amount
    );

    // ─── Modifiers ────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier propertyExists(uint256 _propertyId) {
        require(
            _propertyId > 0 && _propertyId <= propertyCount,
            "Property not found"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────

    constructor(
        address _platformWallet,
        address _valuationContract,
        address _inrcToken,
        uint256 _platformFeeRate
    ) {
        owner = msg.sender;
        platformWallet = _platformWallet;
        valuationContract = _valuationContract;
        inrcToken = _inrcToken;
        platformFeeRate = _platformFeeRate; // 200 = 2%
    }

    // ─── Admin Setup ──────────────────────────────────────

    function setValuationContract(
        address _valuationContract
    ) external onlyOwner {
        valuationContract = _valuationContract;
    }

    function setInrcToken(
        address _inrcToken
    ) external onlyOwner {
        inrcToken = _inrcToken;
    }

    function setPlatformWallet(
        address _platformWallet
    ) external onlyOwner {
        platformWallet = _platformWallet;
    }

    // ─── Create Property ──────────────────────────────────

    function createProperty(
        string memory _name,
        string memory _location,
        uint256 _dbPropertyId,
        uint256 _totalValue,
        uint256 _totalTokens,
        string memory _tokenSymbol
    ) external onlyOwner {
        require(_totalValue > 0, "Value must be greater than 0");
        require(_totalTokens > 0, "Tokens must be greater than 0");

        propertyCount++;

        // Deploy new ERC-20 token for this property
        OwnlyToken token = new OwnlyToken(
            _name,
            _tokenSymbol,
            address(this),
            propertyCount
        );

        properties[propertyCount] = Property({
            name: _name,
            location: _location,
            dbPropertyId: _dbPropertyId,
            totalValue: _totalValue,
            totalTokens: _totalTokens,
            totalRaised: 0,
            tokenAddress: address(token),
            isActive: true,
            isSold: false,
            saleAmount: 0,
            createdAt: block.timestamp
        });

        // Initialize in valuation contract
        if (valuationContract != address(0)) {
            OwnlyValuation(valuationContract).initializeProperty(
                propertyCount,
                _dbPropertyId,
                _totalValue,
                _totalTokens,
                200 // 2% platform fee rate stored for reference
            );
        }

        emit PropertyCreated(
            propertyCount,
            _name,
            address(token),
            _dbPropertyId
        );
    }

    // ─── Invest ───────────────────────────────────────────

    // Investor sends MATIC → receives property tokens
    // Token price based on current NAV from OwnlyValuation
    function invest(
        uint256 _propertyId
    ) external payable propertyExists(_propertyId) {
        Property storage prop = properties[_propertyId];

        require(prop.isActive, "Property not active");
        require(!prop.isSold, "Property already sold");
        require(msg.value > 0, "Must send MATIC");

        // Get current token price from valuation contract (NAV)
        uint256 currentNAV = _getCurrentNAV(_propertyId);
        require(msg.value >= currentNAV, "Below minimum investment");

        // Calculate platform fee (2%)
        uint256 platformFee = (msg.value * platformFeeRate) / 10000;
        uint256 investmentAmount = msg.value - platformFee;

        // Calculate tokens based on NAV
        // tokens = investmentAmount / NAV
        uint256 tokenAmount = investmentAmount / currentNAV;
        require(tokenAmount > 0, "Investment too small for any tokens");

        // Check funding goal not exceeded
        require(
            prop.totalRaised + investmentAmount <= prop.totalValue,
            "Exceeds funding goal"
        );

        // Update state
        prop.totalRaised += investmentAmount;

        // Send platform fee to platform wallet
        if (platformFee > 0 && platformWallet != address(0)) {
            payable(platformWallet).transfer(platformFee);
        }

        // Mint tokens to investor
        OwnlyToken(prop.tokenAddress).mint(msg.sender, tokenAmount);

        // DO NOT update totalTokens in valuation contract with circulating supply.
        // Valuation's totalTokens should remain the max supply to keep NAV correct.

        emit Invested(
            _propertyId,
            msg.sender,
            msg.value,
            tokenAmount,
            platformFee
        );
    }

    // ─── Rent Distribution (INRC) ─────────────────────────

    // Admin deposits INRC rent into claimable pool
    // ONE transaction — investors claim when they want
    function distributeRent(
        uint256 _propertyId,
        uint256 _inrcAmount
    ) external onlyOwner propertyExists(_propertyId) {
        Property storage prop = properties[_propertyId];

        require(prop.isActive, "Property not active");
        require(!prop.isSold, "Property already sold");
        require(_inrcAmount > 0, "Must send rental income");

        // Get total tokens currently in circulation
        uint256 currentSupply = OwnlyToken(prop.tokenAddress)
            .totalSupply();
        require(currentSupply > 0, "No investors yet");

        // Transfer INRC from admin to this contract
        IINRC(inrcToken).transferFrom(
            msg.sender,      // admin wallet
            address(this),   // this contract holds the rent
            _inrcAmount
        );

        // Calculate INRC per token (scaled by 1e18 for precision)
        uint256 inrcPerToken = (_inrcAmount * 1e18) / currentSupply;

        // Add to accumulated rent per token
        totalRentPerToken[_propertyId] += inrcPerToken;

        emit RentDeposited(_propertyId, _inrcAmount, inrcPerToken);
    }

    // Investor claims their accumulated INRC rent
    // They pay their own gas — platform pays nothing
    function claimRent(
        uint256 _propertyId
    ) external propertyExists(_propertyId) {
        OwnlyToken token = OwnlyToken(
            properties[_propertyId].tokenAddress
        );

        uint256 investorTokens = token.balanceOf(msg.sender);
        require(investorTokens > 0, "No tokens held");

        // Calculate total entitled INRC
        uint256 entitled = (investorTokens *
            totalRentPerToken[_propertyId]) / 1e18;

        // Subtract what already claimed
        uint256 alreadyClaimed = rentPerTokenClaimed
            [_propertyId][msg.sender];
        uint256 claimable = entitled - alreadyClaimed;

        require(claimable > 0, "Nothing to claim");

        // Update claimed amount BEFORE transfer (security)
        rentPerTokenClaimed[_propertyId][msg.sender] = entitled;

        // Send INRC to investor
        IINRC(inrcToken).transfer(msg.sender, claimable);

        emit RentClaimed(_propertyId, msg.sender, claimable);
    }

    // View claimable rent without transacting
    function getClaimableRent(
        uint256 _propertyId,
        address _investor
    ) external view returns (uint256) {
        OwnlyToken token = OwnlyToken(
            properties[_propertyId].tokenAddress
        );

        uint256 investorTokens = token.balanceOf(_investor);
        if (investorTokens == 0) return 0;

        uint256 entitled = (investorTokens *
            totalRentPerToken[_propertyId]) / 1e18;
        uint256 alreadyClaimed = rentPerTokenClaimed
            [_propertyId][_investor];

        if (entitled <= alreadyClaimed) return 0;
        return entitled - alreadyClaimed;
    }

    // ─── Property Sale ────────────────────────────────────

    // Admin sells property — deposits MATIC sale proceeds
    function sellProperty(
        uint256 _propertyId
    ) external payable onlyOwner propertyExists(_propertyId) {
        Property storage prop = properties[_propertyId];

        require(prop.isActive, "Property not active");
        require(!prop.isSold, "Already sold");
        require(msg.value > 0, "Must send sale amount");

        prop.isSold = true;
        prop.isActive = false;
        prop.saleAmount = msg.value;

        emit PropertySold(_propertyId, msg.value);
    }

    // Investor claims their share of sale proceeds (MATIC)
    // Tokens transfer to platform wallet (NOT burned)
    function claimSaleProceeds(
        uint256 _propertyId
    ) external propertyExists(_propertyId) {
        Property storage prop = properties[_propertyId];

        require(prop.isSold, "Property not sold yet");

        OwnlyToken token = OwnlyToken(prop.tokenAddress);
        uint256 investorTokens = token.balanceOf(msg.sender);
        require(investorTokens > 0, "No tokens held");

        // Calculate proportional sale proceeds
        uint256 entitledAmount = (prop.saleAmount * investorTokens)
            / prop.totalTokens;

        uint256 alreadyClaimed = saleClaimedReturns
            [_propertyId][msg.sender];
        uint256 claimable = entitledAmount - alreadyClaimed;
        require(claimable > 0, "Nothing to claim");

        // Update before transfer (security)
        saleClaimedReturns[_propertyId][msg.sender] = entitledAmount;

        // Transfer investor's tokens to platform wallet
        // Uses adminTransfer (property contract privilege) — no lock toggle needed
        // since _update already allows property contract movements
        token.adminTransfer(msg.sender, platformWallet, investorTokens);

        // Send MATIC to investor
        payable(msg.sender).transfer(claimable);

        emit SaleProceedsClaimed(_propertyId, msg.sender, claimable);
    }

    // ─── Internal Helpers ─────────────────────────────────

    function _getCurrentNAV(
        uint256 _propertyId
    ) internal view returns (uint256) {
        if (valuationContract == address(0)) {
            // Fallback if valuation not set
            Property storage prop = properties[_propertyId];
            return prop.totalValue / prop.totalTokens;
        }
        return OwnlyValuation(valuationContract)
            .getCurrentNAV(_propertyId);
    }

    // ─── View Functions ───────────────────────────────────

    function getProperty(
        uint256 _id
    ) external view returns (Property memory) {
        return properties[_id];
    }

    function getInvestorInfo(
        uint256 _propertyId,
        address _investor
    ) external view returns (
        uint256 tokensOwned,
        uint256 ownershipPercent,
        uint256 claimableRentINRC,
        uint256 currentNAV,
        uint256 investmentValue
    ) {
        Property storage prop = properties[_propertyId];
        OwnlyToken token = OwnlyToken(prop.tokenAddress);

        tokensOwned = token.balanceOf(_investor);
        ownershipPercent = tokensOwned > 0
            ? (tokensOwned * 10000) / prop.totalTokens
            : 0;

        // Claimable rent in INRC
        uint256 entitled = (tokensOwned *
            totalRentPerToken[_propertyId]) / 1e18;
        uint256 claimed = rentPerTokenClaimed[_propertyId][_investor];
        claimableRentINRC = entitled > claimed ? entitled - claimed : 0;

        currentNAV = _getCurrentNAV(_propertyId);
        investmentValue = tokensOwned * currentNAV;
    }
}
