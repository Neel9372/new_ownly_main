// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock INRC stablecoin — only used in tests
// Simulates the real INRC token behaviour
contract MockINRC is ERC20 {
    constructor() ERC20("Indian Rupee Coin", "INRC") {}

    // Anyone can mint in tests — simulates admin having INRC
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
