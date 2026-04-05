// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OwnlyTreasury {
    address public admin;
    address public propertyContract;
    address public exitWindowContract;
    address public platformWallet;

    // ─── State ────────────────────────────────────────────

    // Total MATIC balance in treasury
    uint256 public reserveBalance;

    // How much each property contributed to treasury
    mapping(uint256 => uint256) public contributionByProperty;

    // Platform tokens held per property (bought from exiting investors)
    mapping(uint256 => uint256) public platformTokens;

    // ─── Events ───────────────────────────────────────────

    event Deposited(uint256 indexed propertyId, uint256 amount);
    event PaidExitingInvestor(address indexed investor, uint256 amount);
    event TokensReceived(uint256 indexed propertyId, uint256 tokens, address from);
    event TokensResold(uint256 indexed propertyId, uint256 tokens, address to);

    // ─── Modifiers ────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == admin ||
            msg.sender == propertyContract ||
            msg.sender == exitWindowContract,
            "Not authorized"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────

    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        admin = msg.sender;
        platformWallet = _platformWallet;
    }

    // ─── Setup ────────────────────────────────────────────

    function setPropertyContract(address _propertyContract) external onlyAdmin {
        propertyContract = _propertyContract;
    }

    function setExitWindowContract(address _exitWindowContract) external onlyAdmin {
        exitWindowContract = _exitWindowContract;
    }

    function setPlatformWallet(address _platformWallet) external onlyAdmin {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }

    // ─── Core Functions ───────────────────────────────────

    // Called by OwnlyProperty — receives 2% of every investment
    function deposit(uint256 propertyId) external payable onlyAuthorized {
        require(msg.value > 0, "Must send MATIC");

        reserveBalance += msg.value;
        contributionByProperty[propertyId] += msg.value;

        emit Deposited(propertyId, msg.value);
    }

    // Called by OwnlyExitWindow — pays exiting investor from reserve
    function payExitingInvestor(
        address investor,
        uint256 amount
    ) external onlyAuthorized {
        require(investor != address(0), "Invalid investor address");
        require(amount > 0, "Amount must be greater than 0");
        require(reserveBalance >= amount, "Insufficient reserve balance");

        reserveBalance -= amount;
        payable(investor).transfer(amount);

        emit PaidExitingInvestor(investor, amount);
    }

    // Called when platform receives tokens from exiting investor
    function receiveTokens(
        uint256 propertyId,
        uint256 tokens,
        address from
    ) external onlyAuthorized {
        require(tokens > 0, "Token amount must be greater than 0");

        platformTokens[propertyId] += tokens;

        emit TokensReceived(propertyId, tokens, from);
    }

    // Platform resells its held tokens to a new investor
    function resellPlatformTokens(
        uint256 propertyId,
        address to,
        uint256 tokens
    ) external onlyAdmin {
        require(tokens > 0, "Token amount must be greater than 0");
        require(to != address(0), "Invalid buyer address");
        require(
            platformTokens[propertyId] >= tokens,
            "Not enough platform tokens"
        );

        platformTokens[propertyId] -= tokens;

        emit TokensResold(propertyId, tokens, to);
    }

    // ─── View Functions ───────────────────────────────────

    function getReserveBalance() external view returns (uint256) {
        return reserveBalance;
    }

    function getPlatformTokens(uint256 propertyId)
        external
        view
        returns (uint256)
    {
        return platformTokens[propertyId];
    }

    function getContributionByProperty(uint256 propertyId)
        external
        view
        returns (uint256)
    {
        return contributionByProperty[propertyId];
    }

    // Allow contract to receive MATIC directly
    receive() external payable {
        reserveBalance += msg.value;
    }
}
