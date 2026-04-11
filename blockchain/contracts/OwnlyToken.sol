// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OwnlyToken is ERC20 {
    address public propertyContract;
    uint256 public propertyId;
    
    // Transfer restrictions
    bool public transfersLocked;

    // Events
    event TokensBurned(address indexed from, uint256 amount);
    event TransferLockUpdated(bool locked);

    constructor(
        string memory name,
        string memory symbol,
        address _propertyContract,
        uint256 _propertyId
    ) ERC20(name, symbol) {
        propertyContract = _propertyContract;
        propertyId = _propertyId;
        transfersLocked = true; // Locked by default
    }

    // ─── Modifiers ───────────────────────────────────────

    modifier onlyPropertyContract() {
        require(
            msg.sender == propertyContract,
            "Only property contract can call this"
        );
        _;
    }

    // ─── Mint ─────────────────────────────────────────────

    // Only OwnlyProperty contract can mint
    function mint(address to, uint256 amount) external onlyPropertyContract {
        _mint(to, amount);
    }

    // ─── Burn ─────────────────────────────────────────────

    // Only called when property is SOLD
    // Burns tokens from a specific address
    function burn(address from, uint256 amount) external onlyPropertyContract {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    // ─── Transfer Lock ────────────────────────────────────

    // Property contract controls lock
    // Locked = tokens cannot be transferred between wallets
    // Unlocked = exit window open OR secondary market active
    function setTransferLock(bool _locked) external onlyPropertyContract {
        transfersLocked = _locked;
        emit TransferLockUpdated(_locked);
    }

    // ─── Override Transfer ────────────────────────────────

    // Block all transfers when locked
    // EXCEPT from/to property contract (for investing + exits)
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Allow minting (from = zero address)
        // Allow burning (to = zero address)
        // Allow property contract movements always
        if (
            from != address(0) &&
            to != address(0) &&
            from != propertyContract &&
            to != propertyContract
        ) {
            require(!transfersLocked, "Tokens locked - not in exit window");
        }

        super._update(from, to, amount);
    }

    // ─── Admin Transfer ───────────────────────────────────

    // Property contract can force-transfer tokens (e.g. on sale claim)
    // Temporarily unlocks transfers since both from/to may be non-property addresses
    function adminTransfer(
        address from,
        address to,
        uint256 amount
    ) external onlyPropertyContract {
        bool wasLocked = transfersLocked;
        if (wasLocked) {
            transfersLocked = false;
        }
        _transfer(from, to, amount);
        if (wasLocked) {
            transfersLocked = true;
        }
    }

    // ─── View Functions ───────────────────────────────────

    function getPropertyId() external view returns (uint256) {
        return propertyId;
    }

    function isLocked() external view returns (bool) {
        return transfersLocked;
    }
}
