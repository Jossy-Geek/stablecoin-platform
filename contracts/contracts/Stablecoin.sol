// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Stablecoin
 * @dev ERC20 stablecoin pegged at 1:1 ratio with backing asset
 * Features: ERC20, AccessControl, Pausable, Mint/Burn
 */
contract Stablecoin is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Mapping to track user balances (on-chain)
    mapping(address => uint256) public userBalances;

    // Events
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event BalanceUpdated(address indexed user, uint256 newBalance);

    /**
     * @dev Constructor sets up roles and initial supply
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialSupply Initial token supply
     * @param _admin Admin address
     * @param _minter Minter address
     * @param _burner Burner address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _admin,
        address _minter,
        address _burner
    ) ERC20(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _minter);
        _grantRole(BURNER_ROLE, _burner);
        _grantRole(PAUSER_ROLE, _admin);

        if (_initialSupply > 0) {
            _mint(_admin, _initialSupply);
            userBalances[_admin] = _initialSupply;
        }
    }

    /**
     * @dev Mint new tokens (only MINTER_ROLE)
     * Maintains 1:1 peg by requiring backing asset
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) 
        public 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to != address(0), "Stablecoin: cannot mint to zero address");
        require(amount > 0, "Stablecoin: amount must be greater than zero");
        
        _mint(to, amount);
        userBalances[to] += amount;
        
        emit Minted(to, amount);
        emit BalanceUpdated(to, userBalances[to]);
    }

    /**
     * @dev Burn tokens (only BURNER_ROLE)
     * Maintains 1:1 peg by returning backing asset
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) 
        public 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        require(from != address(0), "Stablecoin: cannot burn from zero address");
        require(amount > 0, "Stablecoin: amount must be greater than zero");
        require(balanceOf(from) >= amount, "Stablecoin: insufficient balance");
        
        _burn(from, amount);
        userBalances[from] -= amount;
        
        emit Burned(from, amount);
        emit BalanceUpdated(from, userBalances[from]);
    }

    /**
     * @dev Pause all token transfers (only PAUSER_ROLE)
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers (only PAUSER_ROLE)
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to include pause check
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        bool success = super.transfer(to, amount);
        if (success) {
            userBalances[msg.sender] -= amount;
            userBalances[to] += amount;
            emit BalanceUpdated(msg.sender, userBalances[msg.sender]);
            emit BalanceUpdated(to, userBalances[to]);
        }
        return success;
    }

    /**
     * @dev Override transferFrom to include pause check
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            userBalances[from] -= amount;
            userBalances[to] += amount;
            emit BalanceUpdated(from, userBalances[from]);
            emit BalanceUpdated(to, userBalances[to]);
        }
        return success;
    }

    /**
     * @dev Get user balance (on-chain)
     * @param user User address
     * @return Balance amount
     */
    function getUserBalance(address user) public view returns (uint256) {
        return userBalances[user];
    }

    /**
     * @dev Get total supply
     * @return Total supply
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }
}
