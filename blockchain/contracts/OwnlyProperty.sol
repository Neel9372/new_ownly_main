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
    }

    uint256 public propertyCount;
    mapping(uint256 => Property) public properties;

    event PropertyCreated(uint256 indexed id, string name, address tokenAddress);
    event Invested(uint256 indexed propertyId, address investor, uint256 amount, uint256 tokens);

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

        OwnlyToken token = new OwnlyToken(_name, _tokenSymbol, address(this));

        properties[propertyCount] = Property({
            name: _name,
            location: _location,
            totalValue: _totalValue,
            totalTokens: _totalTokens,
            tokenPrice: _totalValue / _totalTokens,
            totalRaised: 0,
            tokenAddress: address(token),
            isActive: true
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

    function getProperty(uint256 _id) external view returns (Property memory) {
        return properties[_id];
    }
}
