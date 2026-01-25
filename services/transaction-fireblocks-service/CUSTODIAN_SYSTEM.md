# Custodian Abstraction System - Complete Documentation

## 📋 Overview

This system provides a flexible, provider-agnostic custodian abstraction that allows switching between different blockchain custody providers (like Fireblocks, BitGo, Coinbase Custody, etc.) without changing business logic.

## 🎯 Key Benefits

1. **No Vendor Lock-in**: Switch providers via configuration
2. **Consistent Interface**: All custodians implement the same interface
3. **Easy Testing**: Mock custodian for development
4. **Extensible**: Add new providers easily
5. **Configuration-Based**: Switch providers via environment variables

## 📚 Architecture

```
┌─────────────────────────────────────────┐
│         Transaction Service            │
│  (Business Logic - Provider Agnostic)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        Custodian Factory                │
│  (Creates provider instances)            │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Fireblocks │  │    BitGo    │
│  Custodian  │  │  Custodian  │
└─────────────┘  └─────────────┘
       │                │
       └───────┬────────┘
               │
               ▼
        ┌──────────────┐
        │ ICustodian   │
        │  Interface   │
        └──────────────┘
```

## 📋 List of Supported Custodians

### ✅ Fully Implemented

1. **Fireblocks** (`fireblocks`)
   - Status: ✅ Fully implemented
   - SDK: `fireblocks-sdk`
   - Features: MPC, multi-chain, DeFi integrations

2. **Mock** (`mock`)
   - Status: ✅ Fully implemented
   - Use Case: Testing and development
   - Features: Simulated responses

3. **Local** (`local`)
   - Status: ✅ Fully implemented
   - Use Case: Direct blockchain interaction
   - Features: No custodian, direct contract calls

### 🟡 Partially Implemented (Interface Ready)

4. **BitGo** (`bitgo`)
   - Status: 🟡 Interface ready, needs SDK integration
   - SDK: `bitgo` npm package
   - Features: Multi-sig, cold storage, insurance

5. **Coinbase Custody** (`coinbase_custody`)
   - Status: 🟡 Interface ready, needs API integration
   - API: REST API
   - Features: Cold storage, NYDFS regulated

### ⚪ Not Yet Implemented (Placeholders)

6. **Anchorage Digital** (`anchorage`)
   - OCC-chartered bank, staking services

7. **Fidelity Digital Assets** (`fidelity`)
   - Traditional finance, cold storage + MPC

8. **Gemini Custody** (`gemini`)
   - NYDFS regulated, exchange integration

9. **Zodia Custody** (`zodia`)
   - Backed by Standard Chartered, UK/EU/ADGM

10. **Komainu** (`komainu`)
    - Nomura + CoinShares + Ledger, Nasdaq-approved

11. **Ledger Enterprise** (`ledger_enterprise`)
    - Hardware security, customizable workflows

12. **Hex Trust** (`hex_trust`)
    - Asia-focused, APAC regulation

13. **Bitcoin Suisse** (`bitcoin_suisse`)
    - Switzerland-based, strong compliance

14. **Onchain Custodian** (`onchain`)
    - Multi-jurisdictional, enterprise custody

15. **Paxos Trust** (`paxos`)
    - NYDFS trust company, tokenization

## 🏭 Custodian Factory

The factory pattern manages custodian instances:

```typescript
// Get custodian instance
const custodian = this.custodianFactory.getCustodian();

if (custodian && custodian.isInitialized()) {
  // Use custodian
  const balance = await custodian.getVaultAssetBalance(vaultId, assetId);
}
```

### Factory Features:
- **Lazy Initialization**: Creates instance only when needed
- **Singleton Pattern**: Reuses existing instance if provider unchanged
- **Automatic Provider Detection**: Reads from `CUSTODIAN_PROVIDER` env var
- **Fallback Handling**: Uses Mock if provider not implemented

## 🔧 Configuration

### Environment Variables

```env
# Enable/Disable Custodian
IS_VAULT_ENABLED=true

# Select Provider
CUSTODIAN_PROVIDER=fireblocks

# Provider-Specific Configuration
# Fireblocks
VAULT_API_KEY=your_key
VAULT_API_SECRET_KEY_PATH=./vault-secret.key

# BitGo
BITGO_API_KEY=your_key
BITGO_API_SECRET=your_secret
BITGO_ENVIRONMENT=test

# Coinbase
COINBASE_API_KEY=your_key
COINBASE_API_SECRET=your_secret
COINBASE_PASSPHRASE=your_passphrase
```

### Switching Providers

Simply change `CUSTODIAN_PROVIDER`:

```env
# Switch to BitGo
CUSTODIAN_PROVIDER=bitgo
BITGO_API_KEY=...
BITGO_API_SECRET=...

# Switch to Mock (for testing)
CUSTODIAN_PROVIDER=mock

# Disable custodian (use local)
IS_VAULT_ENABLED=false
```

## 📝 Implementation Process for New Custodians

### Step 1: Research
- Review custodian API documentation
- Check available SDKs
- Understand authentication
- Review transaction flow

### Step 2: Create Implementation
1. Create file: `implementations/{provider}.custodian.ts`
2. Implement `ICustodian` interface
3. Add to `CustodianProvider` enum
4. Add to factory

### Step 3: Configure
1. Add environment variables to `env.example`
2. Document in `CUSTODIAN_PROVIDERS.md`

### Step 4: Test
1. Unit tests
2. Integration tests
3. End-to-end transaction flow

See `IMPLEMENTATION_GUIDE.md` for detailed steps.

## 🔄 How It Works

### 1. Initialization
```typescript
// Factory reads CUSTODIAN_PROVIDER from env
const provider = configService.get('CUSTODIAN_PROVIDER', 'fireblocks');

// Factory creates appropriate instance
const custodian = factory.createCustodian(provider);
```

### 2. Usage in Transaction Service
```typescript
// Get custodian instance
const custodian = this.custodianFactory.getCustodian();

if (this.isVaultEnabled && custodian?.isInitialized()) {
  // Use custodian for transaction
  const tx = await custodian.submitTransaction(txOptions);
} else {
  // Fallback to local/direct blockchain
}
```

### 3. Provider Switching
- Change `CUSTODIAN_PROVIDER` in `.env`
- Restart service
- Factory automatically creates new instance

## 📁 File Structure

```
src/shared/custodian/
├── interfaces/
│   └── custodian.interface.ts          # ICustodian interface
├── implementations/
│   ├── fireblocks.custodian.ts         # Fireblocks ✅
│   ├── bitgo.custodian.ts              # BitGo 🟡
│   ├── coinbase.custodian.ts           # Coinbase 🟡
│   ├── mock.custodian.ts               # Mock ✅
│   └── local.custodian.ts              # Local ✅
├── custodian-provider.enum.ts          # Provider enum
├── custodian.factory.ts                # Factory pattern
├── custodian.module.ts                 # NestJS module
├── README.md                           # Usage guide
├── CUSTODIAN_PROVIDERS.md              # Provider list
└── IMPLEMENTATION_GUIDE.md             # Implementation guide
```

## 🎯 Interface Methods

All custodians must implement:

1. `getProviderName()` - Returns provider identifier
2. `isInitialized()` - Checks if ready to use
3. `getVaultAssetBalance()` - Get balance
4. `checkVaultBalance()` - Check sufficient balance
5. `verifyWebhookSignature()` - Verify webhooks
6. `calculateGasFee()` - Estimate gas
7. `submitTransaction()` - Submit transaction
8. `getTransactionStatus()` - Get status
9. `createVaultAccount()` - Create account
10. `getVaultAccount()` - Get account details

## 🔐 Security Considerations

1. **Credentials**: Store in environment variables, never in code
2. **Secret Keys**: Use file paths, not direct values
3. **Webhook Verification**: Always verify signatures
4. **Error Handling**: Don't expose sensitive info in errors
5. **Logging**: Don't log credentials or sensitive data

## 🧪 Testing

### Mock Custodian
Use for development and testing:
```env
CUSTODIAN_PROVIDER=mock
```

### Local Mode
Use for direct blockchain interaction:
```env
IS_VAULT_ENABLED=false
```

## 📊 Comparison Matrix

| Provider | Status | SDK Available | Multi-Chain | Insurance | Regulation |
|----------|--------|---------------|-------------|-----------|------------|
| Fireblocks | ✅ | Yes | Yes | Yes | Multiple |
| BitGo | 🟡 | Yes | Yes | Yes | U.S. |
| Coinbase | 🟡 | REST API | Yes | Yes | NYDFS |
| Anchorage | ⚪ | Yes | Yes | Yes | OCC |
| Fidelity | ⚪ | Yes | Limited | Yes | NY Trust |
| Gemini | ⚪ | Yes | Yes | Yes | NYDFS |
| Zodia | ⚪ | Yes | Yes | Yes | UK/EU/ADGM |
| Komainu | ⚪ | Yes | Yes | Yes | Multi |
| Ledger | ⚪ | Yes | Yes | Yes | EU |
| Hex Trust | ⚪ | Yes | Yes | Yes | APAC |
| Bitcoin Suisse | ⚪ | Yes | Yes | Yes | Swiss |
| Onchain | ⚪ | Yes | Yes | Yes | APAC |
| Paxos | ⚪ | Yes | Yes | Yes | NYDFS |

## 🚀 Quick Start

1. **Enable Custodian**
   ```env
   IS_VAULT_ENABLED=true
   CUSTODIAN_PROVIDER=fireblocks
   ```

2. **Configure Provider**
   ```env
   VAULT_API_KEY=your_key
   VAULT_API_SECRET_KEY_PATH=./secret.key
   ```

3. **Use in Code**
   ```typescript
   const custodian = this.custodianFactory.getCustodian();
   if (custodian?.isInitialized()) {
     await custodian.submitTransaction(txOptions);
   }
   ```

## 📚 Additional Resources

- `src/shared/custodian/README.md` - Usage guide
- `src/shared/custodian/CUSTODIAN_PROVIDERS.md` - Provider details
- `src/shared/custodian/IMPLEMENTATION_GUIDE.md` - Implementation steps
- `src/shared/custodian/interfaces/custodian.interface.ts` - Interface definition

## 🔄 Migration from Direct VaultService

The system has been migrated from direct `VaultService` usage to the factory pattern:

**Before:**
```typescript
private vaultService: VaultService;
await this.vaultService.submitTransaction(txOptions);
```

**After:**
```typescript
private custodianFactory: CustodianFactory;
const custodian = this.custodianFactory.getCustodian();
await custodian.submitTransaction(txOptions);
```

## ✅ Benefits Achieved

1. ✅ **Flexibility**: Switch providers via config
2. ✅ **Testability**: Mock provider for testing
3. ✅ **Extensibility**: Easy to add new providers
4. ✅ **Maintainability**: Single interface, multiple implementations
5. ✅ **No Vendor Lock-in**: Business logic independent of provider
