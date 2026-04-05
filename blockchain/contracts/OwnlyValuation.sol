// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OwnlyValuation {
    address public admin;
    address public propertyContract;

    // ─── Structs ──────────────────────────────────────────

    struct PropertyValuation {
        uint256 dbPropertyId;       // Links to PostgreSQL
        uint256 currentValue;       // Latest ML predicted value
        uint256 initialValue;       // Original value at listing
        uint256 lastUpdated;        // Timestamp of last update
        uint256 totalRentCollected; // Total rent received so far
        uint256 platformFeeRate;    // e.g. 200 = 2%
        uint256 mgmtFeeRate;        // e.g. 100 = 1%
        bool exists;
    }

    struct NAVRecord {
        uint256 nav;
        uint256 timestamp;
    }

    // ─── State Variables ──────────────────────────────────

    mapping(uint256 => PropertyValuation) public valuations;
    mapping(uint256 => NAVRecord[30]) public navHistory;
    mapping(uint256 => uint256) public navHistoryIndex;
    mapping(uint256 => uint256) public navHistoryCount;
    mapping(uint256 => uint256) public totalTokens;

    // ─── Events ───────────────────────────────────────────

    event PropertyValueUpdated(
        uint256 indexed propertyId,
        uint256 oldValue,
        uint256 newValue,
        uint256 timestamp
    );

    event NAVCalculated(
        uint256 indexed propertyId,
        uint256 nav,
        uint256 timestamp
    );

    event PropertyContractSet(address propertyContract);

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

    // ─── Constructor ──────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Setup ────────────────────────────────────────────

    function setPropertyContract(
        address _propertyContract
    ) external onlyAdmin {
        propertyContract = _propertyContract;
        emit PropertyContractSet(_propertyContract);
    }

    function initializeProperty(
        uint256 propertyId,
        uint256 dbPropertyId,
        uint256 initialValue,
        uint256 _totalTokens,
        uint256 _platformFeeRate,
        uint256 _mgmtFeeRate
    ) external onlyAdminOrProperty {
        require(!valuations[propertyId].exists, "Already initialized");

        valuations[propertyId] = PropertyValuation({
            dbPropertyId: dbPropertyId,
            currentValue: initialValue,
            initialValue: initialValue,
            lastUpdated: block.timestamp,
            totalRentCollected: 0,
            platformFeeRate: _platformFeeRate,
            mgmtFeeRate: _mgmtFeeRate,
            exists: true
        });

        totalTokens[propertyId] = _totalTokens;
        _recordNAV(propertyId);
    }

    // ─── Update Functions ─────────────────────────────────

    // For NOW: admin calls manually
    // LATER: ML backend calls automatically every day
    function updatePropertyValue(
        uint256 propertyId,
        uint256 newValue
    ) external onlyAdmin {
        require(valuations[propertyId].exists, "Property not found");
        require(newValue > 0, "Value must be greater than 0");

        uint256 oldValue = valuations[propertyId].currentValue;
        valuations[propertyId].currentValue = newValue;
        valuations[propertyId].lastUpdated = block.timestamp;

        _recordNAV(propertyId);

        emit PropertyValueUpdated(
            propertyId,
            oldValue,
            newValue,
            block.timestamp
        );
    }

    function updateRentCollected(
        uint256 propertyId,
        uint256 rentAmount
    ) external onlyAdminOrProperty {
        require(valuations[propertyId].exists, "Property not found");
        valuations[propertyId].totalRentCollected += rentAmount;
        _recordNAV(propertyId);
    }

    function updateTotalTokens(
        uint256 propertyId,
        uint256 newTotal
    ) external onlyAdminOrProperty {
        totalTokens[propertyId] = newTotal;
    }

    // ─── NAV Calculation ──────────────────────────────────

    function calculateNAV(uint256 propertyId)
    public
    view
    returns (uint256)
{
    require(valuations[propertyId].exists, "Property not found");

    // Return current value if no tokens yet
    if (totalTokens[propertyId] == 0) {
        return valuations[propertyId].currentValue;
    }

    PropertyValuation memory val = valuations[propertyId];
    uint256 grossValue = val.currentValue + val.totalRentCollected;
    uint256 platformFee = (grossValue * val.platformFeeRate) / 10000;
    uint256 mgmtFee = (grossValue * val.mgmtFeeRate) / 10000;
    uint256 netValue = grossValue - platformFee - mgmtFee;
    return netValue / totalTokens[propertyId];
}

    // ─── NAV History ──────────────────────────────────────

    function _recordNAV(uint256 propertyId) internal {
    // Skip NAV recording if no tokens yet
    if (totalTokens[propertyId] == 0) {
        return;
    }

    uint256 nav = calculateNAV(propertyId);
    uint256 index = navHistoryIndex[propertyId];

    navHistory[propertyId][index] = NAVRecord({
        nav: nav,
        timestamp: block.timestamp
    });

    navHistoryIndex[propertyId] = (index + 1) % 30;

    if (navHistoryCount[propertyId] < 30) {
        navHistoryCount[propertyId]++;
    }

    emit NAVCalculated(propertyId, nav, block.timestamp);
}

    function getNAVHistory(uint256 propertyId)
        external
        view
        returns (NAVRecord[] memory)
    {
        uint256 count = navHistoryCount[propertyId];
        NAVRecord[] memory history = new NAVRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            history[i] = navHistory[propertyId][i];
        }
        return history;
    }

    // ─── View Functions ───────────────────────────────────

    function getCurrentNAV(uint256 propertyId)
        external
        view
        returns (uint256)
    {
        return calculateNAV(propertyId);
    }

    function getValuation(uint256 propertyId)
        external
        view
        returns (PropertyValuation memory)
    {
        return valuations[propertyId];
    }

    function getAppreciation(uint256 propertyId)
        external
        view
        returns (uint256 appreciationPercent)
    {
        PropertyValuation memory val = valuations[propertyId];
        require(val.exists, "Property not found");
        if (val.currentValue <= val.initialValue) return 0;
        return ((val.currentValue - val.initialValue) * 10000)
               / val.initialValue;
    }
}