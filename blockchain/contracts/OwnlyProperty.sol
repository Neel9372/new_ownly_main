// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OwnlyToken.sol";

contract OwnlyProperty {
    address public owner;

    struct Property {
        string name;
        string location;
        uint256 totalValue;
        uint256 totalTokens;
        uint256 tokenPrice;
        uint256 totalRaised;
        address tokenAddress;
        bool isActive;
        uint256 totalRentDeposited;
        uint256 saleAmount;
        bool isSold;
    }

    uint256 public propertyCount;
    mapping(uint256 => Property) public properties;

    // Track how much each investor has already claimed per property
    mapping(uint256 => mapping(address => uint256)) public claimedReturns;

    event PropertyCreated(uint256 indexed id, string name, address tokenAddress);
    event Invested(uint256 indexed propertyId, address investor, uint256 amount, uint256 tokens);
    event RentDeposited(uint256 indexed propertyId, uint256 amount);
    event PropertySold(uint256 indexed propertyId, uint256 saleAmount);
    event ReturnsClaimed(uint256 indexed propertyId, address investor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createProperty(
        string memory _name,
        string memory _location,
        uint256 _totalValue,
        uint256 _totalTokens,
        string memory _tokenSymbol
    ) external onlyOwner {
        propertyCount++;

        OwnlyToken token = new OwnlyToken(_name, _tokenSymbol, address(this), propertyCount);

        properties[propertyCount] = Property({
            name: _name,
            location: _location,
            totalValue: _totalValue,
            totalTokens: _totalTokens,
            tokenPrice: _totalValue / _totalTokens,
            totalRaised: 0,
            tokenAddress: address(token),
            isActive: true,
            totalRentDeposited: 0,
            saleAmount: 0,
            isSold: false
        });

        emit PropertyCreated(propertyCount, _name, address(token));
    }

    function invest(uint256 _propertyId) external payable {
        Property storage prop = properties[_propertyId];
        require(prop.isActive, "Property not active");
        require(msg.value > 0, "Must send MATIC");
        require(msg.value >= prop.tokenPrice, "Below minimum investment");

        uint256 tokenAmount = (msg.value * prop.totalTokens) / prop.totalValue;
        require(prop.totalRaised + msg.value <= prop.totalValue, "Exceeds funding goal");

        prop.totalRaised += msg.value;
        OwnlyToken(prop.tokenAddress).mint(msg.sender, tokenAmount);

        emit Invested(_propertyId, msg.sender, msg.value, tokenAmount);
    }

    // Admin deposits rental income for a property
    function distributeRent(uint256 _propertyId) external payable onlyOwner {
        Property storage prop = properties[_propertyId];
        require(prop.isActive, "Property not active");
        require(!prop.isSold, "Property already sold");
        require(msg.value > 0, "Must send rental income");

        prop.totalRentDeposited += msg.value;

        emit RentDeposited(_propertyId, msg.value);
    }

    // Admin sells the property — deposits sale amount
    function sellProperty(uint256 _propertyId) external payable onlyOwner {
        Property storage prop = properties[_propertyId];
        require(prop.isActive, "Property not active");
        require(!prop.isSold, "Already sold");
        require(msg.value > 0, "Must send sale amount");

        prop.isSold = true;
        prop.isActive = false;
        prop.saleAmount = msg.value;

        emit PropertySold(_propertyId, msg.value);
    }

    // Investor claims their share of rent + sale proceeds
    function claimReturns(uint256 _propertyId) external {
        Property storage prop = properties[_propertyId];
        OwnlyToken token = OwnlyToken(prop.tokenAddress);

        uint256 investorTokens = token.balanceOf(msg.sender);
        require(investorTokens > 0, "No tokens held");

        // Calculate total entitled amount (rent + sale proceeds)
        uint256 totalPool = prop.totalRentDeposited + prop.saleAmount;
        uint256 entitledAmount = (totalPool * investorTokens) / prop.totalTokens;

        // Subtract what they already claimed
        uint256 alreadyClaimed = claimedReturns[_propertyId][msg.sender];
        uint256 claimable = entitledAmount - alreadyClaimed;
        require(claimable > 0, "Nothing to claim");

        // Update claimed amount and send MATIC
        claimedReturns[_propertyId][msg.sender] = entitledAmount;
        payable(msg.sender).transfer(claimable);

        emit ReturnsClaimed(_propertyId, msg.sender, claimable);
    }

    function getProperty(uint256 _id) external view returns (Property memory) {
        return properties[_id];
    }
}
