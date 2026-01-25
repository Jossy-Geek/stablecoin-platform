# Smart Contracts Documentation

This document provides detailed information about the smart contracts used in the Stablecoin Platform.

## 📋 Overview

The platform uses a custom ERC20 stablecoin contract that implements:
- **ERC20 Standard**: Full ERC20 token functionality
- **AccessControl**: Role-based access control
- **Pausable**: Emergency pause functionality
- **1:1 Peg**: Maintains 1:1 ratio with backing asset

## 💎 Contract: Stablecoin.sol

### Contract Features

```solidity
contract Stablecoin is ERC20, AccessControl, Pausable
```

### Roles

- **DEFAULT_ADMIN_ROLE**: Full administrative control
- **MINTER_ROLE**: Can mint new tokens
- **BURNER_ROLE**: Can burn tokens
- **PAUSER_ROLE**: Can pause/unpause the contract

### Key Functions

#### Minting
```solidity
function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) whenNotPaused
```
- Mints new tokens to specified address
- Requires MINTER_ROLE
- Updates user balance mapping
- Emits Minted event

#### Burning
```solidity
function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) whenNotPaused
```
- Burns tokens from specified address
- Requires BURNER_ROLE
- Updates user balance mapping
- Emits Burned event

#### Pausing
```solidity
function pause() public onlyRole(PAUSER_ROLE)
function unpause() public onlyRole(PAUSER_ROLE)
```
- Pauses/unpauses all token transfers
- Requires PAUSER_ROLE
- Emergency functionality

#### Balance Tracking
```solidity
function getUserBalance(address user) public view returns (uint256)
```
- Returns user's on-chain balance
- Read from balance mapping

### Events

- `Minted(address indexed to, uint256 amount)` - Emitted when tokens are minted
- `Burned(address indexed from, uint256 amount)` - Emitted when tokens are burned
- `BalanceUpdated(address indexed user, uint256 newBalance)` - Emitted when balance changes

## 🚀 Deployment

### Prerequisites

1. Install dependencies:
```bash
cd contracts
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Local Deployment

```bash
# Start Hardhat node (in separate terminal)
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia
```

### Mainnet Deployment

⚠️ **Warning**: Only deploy to mainnet after thorough testing!

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

## 🧪 Testing

Run tests:
```bash
npx hardhat test
```

Test coverage:
```bash
npx hardhat coverage
```

## 📝 Contract Addresses

After deployment, contract addresses are saved to:
- `contracts/deployments/localhost/Stablecoin.json`
- `contracts/deployments/sepolia/Stablecoin.json`
- `contracts/deployments/mainnet/Stablecoin.json`

## 🔐 Security Considerations

### OpenZeppelin Contracts

The contract uses OpenZeppelin's battle-tested contracts:
- `ERC20`: Standard token implementation
- `AccessControl`: Role-based access control
- `Pausable`: Emergency pause functionality

### Best Practices

1. **Access Control**: All critical functions are protected by roles
2. **Pausable**: Emergency pause capability for security incidents
3. **Input Validation**: Checks for zero addresses and amounts
4. **Balance Tracking**: Maintains accurate balance mapping
5. **Event Emission**: All state changes emit events

### Audit Recommendations

Before mainnet deployment:
- [ ] Professional smart contract audit
- [ ] Comprehensive test coverage
- [ ] Gas optimization review
- [ ] Security best practices review
- [ ] Documentation review

## 🔄 Integration with Backend

### Contract Interaction

Backend services interact with the contract using Ethers.js through custodian providers:

```typescript
import { ethers } from 'ethers';

// Connect to contract
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Mint tokens
await contract.mint(userAddress, amount);

// Burn tokens
await contract.burn(userAddress, amount);

// Get balance
const balance = await contract.getUserBalance(userAddress);

// Listen to events
contract.on('Minted', (to, amount) => {
  // Handle mint event
});
```

### Event Listening

Services listen to contract events for real-time updates:

```typescript
// Listen to Minted events
contract.on('Minted', async (to, amount, event) => {
  // Update database
  // Emit Kafka event
  // Send notification
});
```

## 📊 Contract State Management

The backend maintains contract state in the database:

- **contract_state** table tracks:
  - Contract address
  - Network
  - Pause status
  - Total supply
  - Last sync time

## 🛠️ Development

### Compile Contracts

```bash
npx hardhat compile
```

### Verify Contracts (Testnet/Mainnet)

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS "Constructor" "Args"
```

### Gas Optimization

The contract uses Solidity optimizer:
```javascript
optimizer: {
  enabled: true,
  runs: 200
}
```

## 📚 Additional Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)

---

**Note**: This contract is designed for demonstration purposes. For production use, conduct a professional security audit.
