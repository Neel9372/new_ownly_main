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
        uint256 platformFeeRate;    // e.g. 200 = 2% (charged separately)
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
        uint256 _platformFeeRate
        // NOTE: mgmtFeeRate REMOVED
        // Management fee charged separately
        // NOT deducted from NAV
    ) external onlyAdminOrProperty {
        require(!valuations[propertyId].exists, "Already initialized");
        require(initialValue > 0, "Value must be greater than 0");

        valuations[propertyId] = PropertyValuation({
            dbPropertyId: dbPropertyId,
            currentValue: initialValue,
            initialValue: initialValue,
            lastUpdated: block.timestamp,
            platformFeeRate: _platformFeeRate,
            exists: true
        });

        totalTokens[propertyId] = _totalTokens;

        // Only record NAV if tokens exist
        if (_totalTokens > 0) {
            _recordNAV(propertyId);
        }
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

        // Only record if tokens exist
        if (totalTokens[propertyId] > 0) {
            _recordNAV(propertyId);
        }

        emit PropertyValueUpdated(
            propertyId,
            oldValue,
            newValue,
            block.timestamp
        );
    }

    function updateTotalTokens(
        uint256 propertyId,
        uint256 newTotal
    ) external onlyAdminOrProperty {
        require(valuations[propertyId].exists, "Property not found");
        totalTokens[propertyId] = newTotal;

        // Record NAV now that tokens exist
        if (newTotal > 0) {
            _recordNAV(propertyId);
        }
    }

    // ─── NAV Calculation ──────────────────────────────────

    // NAV = Property Value ÷ Total Tokens
    // Simple and clean — no fees, no rent
    // Fees charged separately on investment
    // Rent handled in separate claimable pool
    function calculateNAV(uint256 propertyId)
        public
        view
        returns (uint256)
    {
        require(valuations[propertyId].exists, "Property not found");

        // Return full current value if no tokens yet
        // This is the initial token price before any investment
        if (totalTokens[propertyId] == 0) {
            return valuations[propertyId].currentValue;
        }

        // NAV = Pure property value ÷ total tokens
        // No fees deducted here
        // No rent included here
        return valuations[propertyId].currentValue
               / totalTokens[propertyId];
    }

    // ─── NAV History ──────────────────────────────────────

    function _recordNAV(uint256 propertyId) internal {
        uint256 nav = calculateNAV(propertyId);
        uint256 index = navHistoryIndex[propertyId];

        navHistory[propertyId][index] = NAVRecord({
            nav: nav,
            timestamp: block.timestamp
        });

        // Circular buffer — overwrites oldest after 30 records
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

        // Returns basis points: 1500 = 15%
        return ((val.currentValue - val.initialValue) * 10000)
               / val.initialValue;
    }

    function getTokenPrice(uint256 propertyId)
        external
        view
        returns (uint256)
    {
        return calculateNAV(propertyId);
    }
}