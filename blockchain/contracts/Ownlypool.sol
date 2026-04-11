// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OwnlyPool {
    address public admin;
    address public propertyContract;

    // ─── Enums ────────────────────────────────────────────

    enum PoolStatus { OPEN, FUNDED, CLOSED }

    // ─── Structs ──────────────────────────────────────────

    struct Pool {
        uint256 dbPropertyId;       // Links to PostgreSQL properties.id
        uint256 totalSize;          // Total funding goal (in Wei)
        uint256 filledAmount;       // How much has been raised so far
        uint256 filledPercent;      // filledAmount / totalSize * 100
        uint256 investorCount;      // Number of unique investors
        uint256 tokenPrice;         // Price per token (in Wei)
        PoolStatus status;          // OPEN / FUNDED / CLOSED
        bool exists;
    }

    // ─── State ────────────────────────────────────────────

    mapping(uint256 => Pool) public pools;

    // Track unique investors per property
    mapping(uint256 => mapping(address => bool)) public hasInvested;

    // ─── Events ───────────────────────────────────────────

    event PoolCreated(uint256 indexed propertyId, uint256 totalSize, uint256 tokenPrice);
    event PoolUpdated(uint256 indexed propertyId, uint256 filledAmount, uint256 filledPercent);
    event PoolFunded(uint256 indexed propertyId);
    event PoolClosed(uint256 indexed propertyId);

    // ─── Modifiers ────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    modifier onlyAdminOrProperty() {
        require(
            msg.sender == admin || msg.sender == propertyContract,
            "Not authorized"
        );
        _;
    }

    // ─── Constructor OwnlyPool.sol ──────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Setup ────────────────────────────────────────────

    function setPropertyContract(address _propertyContract) external onlyAdmin {
        propertyContract = _propertyContract;
    }

    // ─── Pool Management ──────────────────────────────────

    // Called by admin or OwnlyProperty when a new property is created
    function setupPool(
        uint256 propertyId,
        uint256 dbPropertyId,
        uint256 totalSize,
        uint256 tokenPrice
    ) external onlyAdminOrProperty {
        require(!pools[propertyId].exists, "Pool already exists");
        require(totalSize > 0, "Total size must be greater than 0");
        require(tokenPrice > 0, "Token price must be greater than 0");

        pools[propertyId] = Pool({
            dbPropertyId: dbPropertyId,
            totalSize: totalSize,
            filledAmount: 0,
            filledPercent: 0,
            investorCount: 0,
            tokenPrice: tokenPrice,
            status: PoolStatus.OPEN,
            exists: true
        });

        emit PoolCreated(propertyId, totalSize, tokenPrice);
    }

    // Called by OwnlyProperty on each investment
    function updatePool(
        uint256 propertyId,
        uint256 amount,
        address investor
    ) external onlyAdminOrProperty {
        Pool storage pool = pools[propertyId];
        require(pool.exists, "Pool not found");
        require(pool.status == PoolStatus.OPEN, "Pool is not open");

        pool.filledAmount += amount;
        pool.filledPercent = (pool.filledAmount * 100) / pool.totalSize;

        // Count unique investors
        if (!hasInvested[propertyId][investor]) {
            hasInvested[propertyId][investor] = true;
            pool.investorCount++;
        }

        // Auto mark as FUNDED if goal reached
        if (pool.filledAmount >= pool.totalSize) {
            pool.status = PoolStatus.FUNDED;
            emit PoolFunded(propertyId);
        }

        emit PoolUpdated(propertyId, pool.filledAmount, pool.filledPercent);
    }

    // Admin closes a pool manually
    function closePool(uint256 propertyId) external onlyAdmin {
        Pool storage pool = pools[propertyId];
        require(pool.exists, "Pool not found");
        require(pool.status != PoolStatus.CLOSED, "Already closed");

        pool.status = PoolStatus.CLOSED;
        emit PoolClosed(propertyId);
    }

    // ─── View Functions ───────────────────────────────────

    function getPoolInfo(uint256 propertyId)
        external
        view
        returns (Pool memory)
    {
        require(pools[propertyId].exists, "Pool not found");
        return pools[propertyId];
    }

    function getPoolStatus(uint256 propertyId)
        external
        view
        returns (PoolStatus)
    {
        require(pools[propertyId].exists, "Pool not found");
        return pools[propertyId].status;
    }

    function isPoolOpen(uint256 propertyId) external view returns (bool) {
        return pools[propertyId].exists &&
               pools[propertyId].status == PoolStatus.OPEN;
    }
}
