// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OwnlyToken.sol";
import "./OwnlyTreasury.sol";

contract OwnlyExitWindow {
    address public admin;
    address public propertyContract;
    OwnlyTreasury public treasury;

    // ─── Constants ────────────────────────────────────────

    uint256 public constant WINDOW_DURATION   = 30 days;
    uint256 public constant MIN_HOLD_PERIOD   = 2 * 365 days; // 2 years
    uint256 public constant MAX_EXIT_PERCENT  = 25;            // 25% per window

    // ─── Structs ──────────────────────────────────────────

    struct ExitWindow {
        bool isOpen;
        uint256 openedAt;       // Timestamp when window opened
        uint256 closesAt;       // Timestamp when window closes
        uint256 lockedNAV;      // NAV locked at window open (fair price)
        uint256 queueSize;      // Number of requests in queue
        uint256 totalTokensQueued;
    }

    struct ExitRequest {
        address investor;
        uint256 tokenAmount;
        bool processed;
    }

    // ─── State ────────────────────────────────────────────

    // propertyId => ExitWindow
    mapping(uint256 => ExitWindow) public exitWindows;

    // propertyId => list of exit requests
    mapping(uint256 => ExitRequest[]) public exitQueue;

    // Track when each investor first invested per property
    // Set by OwnlyProperty when investor first invests
    mapping(uint256 => mapping(address => uint256)) public investmentTimestamp;

    // Track tokens already sold per investor per window
    // propertyId => windowOpenedAt => investor => tokensSold
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public tokensSoldInWindow;

    // ─── Events ───────────────────────────────────────────

    event ExitWindowOpened(uint256 indexed propertyId, uint256 lockedNAV, uint256 closesAt);
    event ExitWindowClosed(uint256 indexed propertyId, uint256 remainingQueue);
    event ExitRequested(uint256 indexed propertyId, address indexed investor, uint256 tokenAmount);
    event ExitProcessed(uint256 indexed propertyId, address indexed investor, uint256 tokenAmount, uint256 paidAmount);

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

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        admin = msg.sender;
        treasury = OwnlyTreasury(payable(_treasury));
    }

    // ─── Setup ────────────────────────────────────────────

    function setPropertyContract(address _propertyContract) external onlyAdmin {
        propertyContract = _propertyContract;
    }

    // Called by OwnlyProperty when investor first invests
    function recordInvestmentTimestamp(
        uint256 propertyId,
        address investor
    ) external onlyAdminOrProperty {
        // Only record first investment time
        if (investmentTimestamp[propertyId][investor] == 0) {
            investmentTimestamp[propertyId][investor] = block.timestamp;
        }
    }

    // ─── Window Management ────────────────────────────────

    // Admin opens exit window with locked NAV
    function openExitWindow(
        uint256 propertyId,
        uint256 currentNAV
    ) external onlyAdmin {
        ExitWindow storage window = exitWindows[propertyId];
        require(!window.isOpen, "Window already open");
        require(currentNAV > 0, "NAV must be greater than 0");

        window.isOpen = true;
        window.openedAt = block.timestamp;
        window.closesAt = block.timestamp + WINDOW_DURATION;
        window.lockedNAV = currentNAV;

        emit ExitWindowOpened(propertyId, currentNAV, window.closesAt);
    }

    // Admin closes exit window
    function closeExitWindow(uint256 propertyId) external onlyAdmin {
        ExitWindow storage window = exitWindows[propertyId];
        require(window.isOpen, "Window not open");

        window.isOpen = false;

        // Count unprocessed requests remaining
        uint256 remaining = 0;
        for (uint256 i = 0; i < exitQueue[propertyId].length; i++) {
            if (!exitQueue[propertyId][i].processed) {
                remaining++;
            }
        }

        emit ExitWindowClosed(propertyId, remaining);
    }

    // ─── Exit Request ─────────────────────────────────────

    function requestExit(
        uint256 propertyId,
        uint256 tokenAmount,
        address tokenAddress
    ) external {
        ExitWindow storage window = exitWindows[propertyId];

        // Check window is open and not expired
        require(window.isOpen, "Exit window not open");
        require(block.timestamp <= window.closesAt, "Exit window expired");
        require(tokenAmount > 0, "Token amount must be greater than 0");

        // Check 2 year minimum hold
        uint256 investedAt = investmentTimestamp[propertyId][msg.sender];
        require(investedAt > 0, "No investment found");
        require(
            block.timestamp >= investedAt + MIN_HOLD_PERIOD,
            "Minimum 2 year hold period not met"
        );

        // Check investor has enough tokens
        OwnlyToken token = OwnlyToken(tokenAddress);
        uint256 investorBalance = token.balanceOf(msg.sender);
        require(investorBalance > 0, "No tokens held");

        // Check doesn't exceed 25% per window
        uint256 maxAllowed = (investorBalance * MAX_EXIT_PERCENT) / 100;
        uint256 alreadySold = tokensSoldInWindow[propertyId][window.openedAt][msg.sender];
        require(
            alreadySold + tokenAmount <= maxAllowed,
            "Exceeds 25% max exit per window"
        );
        require(tokenAmount <= investorBalance, "Not enough tokens");

        // Record request
        tokensSoldInWindow[propertyId][window.openedAt][msg.sender] += tokenAmount;
        exitQueue[propertyId].push(ExitRequest({
            investor: msg.sender,
            tokenAmount: tokenAmount,
            processed: false
        }));

        exitWindows[propertyId].queueSize++;
        exitWindows[propertyId].totalTokensQueued += tokenAmount;

        emit ExitRequested(propertyId, msg.sender, tokenAmount);
    }

    // ─── Process Exits ────────────────────────────────────

    // Admin calls this to process all queued exit requests
    // newInvestors: array of new investor addresses (address(0) = use treasury)
    function processExits(
        uint256 propertyId,
        address tokenAddress,
        address[] calldata newInvestors
    ) external onlyAdmin {
        ExitRequest[] storage queue = exitQueue[propertyId];
        ExitWindow storage window = exitWindows[propertyId];
        OwnlyToken token = OwnlyToken(tokenAddress);

        uint256 newInvestorIndex = 0;
        uint256 lockedNAV = window.lockedNAV;

        for (uint256 i = 0; i < queue.length; i++) {
            if (queue[i].processed) continue;

            ExitRequest storage request = queue[i];
            uint256 payout = request.tokenAmount * lockedNAV;

            if (
                newInvestorIndex < newInvestors.length &&
                newInvestors[newInvestorIndex] != address(0)
            ) {
                // New investor exists → P2P transfer
                address newInvestor = newInvestors[newInvestorIndex];
                newInvestorIndex++;

                // Transfer tokens from exiting investor to new investor
                // Unlock transfers temporarily for this operation
                token.setTransferLock(false);
                token.transferFrom(request.investor, newInvestor, request.tokenAmount);
                token.setTransferLock(true);

                // Pay exiting investor from new investor's payment
                // (Admin must have sent MATIC to cover this)
                payable(request.investor).transfer(payout);
            } else {
                // No new investor → treasury pays
                treasury.payExitingInvestor(request.investor, payout);

                // Tokens go to platform wallet
                token.setTransferLock(false);
                token.transferFrom(request.investor, treasury.platformWallet(), request.tokenAmount);
                token.setTransferLock(true);

                // Record platform received tokens
                treasury.receiveTokens(propertyId, request.tokenAmount, request.investor);
            }

            request.processed = true;
            window.queueSize--;
            window.totalTokensQueued -= request.tokenAmount;

            emit ExitProcessed(propertyId, request.investor, request.tokenAmount, payout);
        }
    }

    // ─── View Functions ───────────────────────────────────

    function getExitWindowInfo(uint256 propertyId)
        external
        view
        returns (
            bool isOpen,
            uint256 daysRemaining,
            uint256 navAtOpen,
            uint256 queueSize,
            uint256 totalTokensQueued
        )
    {
        ExitWindow memory window = exitWindows[propertyId];
        isOpen = window.isOpen;

        if (window.isOpen && block.timestamp < window.closesAt) {
            daysRemaining = (window.closesAt - block.timestamp) / 1 days;
        } else {
            daysRemaining = 0;
        }

        navAtOpen = window.lockedNAV;
        queueSize = window.queueSize;
        totalTokensQueued = window.totalTokensQueued;
    }

    function getExitQueue(uint256 propertyId)
        external
        view
        returns (ExitRequest[] memory)
    {
        return exitQueue[propertyId];
    }

    function canExit(
        uint256 propertyId,
        address investor
    ) external view returns (bool) {
        uint256 investedAt = investmentTimestamp[propertyId][investor];
        if (investedAt == 0) return false;
        return block.timestamp >= investedAt + MIN_HOLD_PERIOD;
    }

    // Allow contract to receive MATIC (for P2P payouts)
    receive() external payable {}
}
