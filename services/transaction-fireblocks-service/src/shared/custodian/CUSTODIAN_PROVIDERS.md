# Supported Custodian Providers

This document lists the top 5 supported custodian providers and their implementation status.

## 📋 Top 5 Custodian Providers

The following custodians have been selected based on industry standards, regulatory compliance, and implementation status:

### 1. **Fireblocks** ✅ Implemented
- **Provider ID:** `fireblocks`
- **Status:** Fully implemented
- **Features:**
  - Multi-party computation (MPC)
  - Multi-chain support
  - DeFi integrations
  - Enterprise-grade security
- **Configuration:**
  ```env
  CUSTODIAN_PROVIDER=fireblocks
  VAULT_API_KEY=your_api_key
  VAULT_API_SECRET_KEY_PATH=./vault-secret.key
  ```
- **SDK:** `fireblocks-sdk` (npm package)

### 2. **BitGo** 🟡 Partially Implemented
- **Provider ID:** `bitgo`
- **Status:** Interface ready, needs SDK integration
- **Features:**
  - Multi-signature wallets
  - Cold storage
  - Insurance coverage
  - Institutional-grade custody
- **Configuration:**
  ```env
  CUSTODIAN_PROVIDER=bitgo
  BITGO_API_KEY=your_api_key
  BITGO_API_SECRET=your_api_secret
  BITGO_ENVIRONMENT=test  # or 'prod'
  ```
- **SDK:** `bitgo` (npm package)
- **Implementation Notes:** Install SDK and implement methods in `bitgo.custodian.ts`

### 3. **Coinbase Custody** 🟡 Partially Implemented
- **Provider ID:** `coinbase_custody` or `coinbase`
- **Status:** Interface ready, needs API integration
- **Features:**
  - Cold storage
  - Insurance coverage
  - Regulatory compliance (NYDFS)
  - Institutional custody
- **Configuration:**
  ```env
  CUSTODIAN_PROVIDER=coinbase_custody
  COINBASE_API_KEY=your_api_key
  COINBASE_API_SECRET=your_api_secret
  COINBASE_PASSPHRASE=your_passphrase
  ```
- **SDK:** Coinbase API (REST)
- **Implementation Notes:** Use Coinbase REST API or SDK

### 4. **Anchorage Digital** ⚪ Not Implemented
- **Provider ID:** `anchorage`
- **Status:** Placeholder (uses Mock fallback)
- **Features:**
  - Federally chartered crypto bank (OCC)
  - Staking services
  - Settlement services
  - Bank-grade compliance
- **Regulation:** U.S. OCC-chartered bank
- **Best For:** U.S. institutions needing federal oversight

### 5. **Fidelity Digital Assets** ⚪ Not Implemented
- **Provider ID:** `fidelity`
- **Status:** Placeholder (uses Mock fallback)
- **Features:**
  - Traditional finance pedigree
  - Cold storage + MPC workflows
  - Strong governance
  - Tokenized real-world assets
- **Regulation:** NY trust law, U.S. and Europe
- **Best For:** Asset managers, pensions, conservative institutions

### 6. **Mock** ✅ Implemented
- **Provider ID:** `mock`
- **Status:** Fully implemented
- **Features:**
  - Simulated responses
  - No real transactions
  - Development/testing
- **Configuration:**
  ```env
  CUSTODIAN_PROVIDER=mock
  ```
- **Use Case:** Testing and development

### 7. **Local** ✅ Implemented
- **Provider ID:** `local`
- **Status:** Fully implemented
- **Features:**
  - Direct blockchain interaction
  - No custodian
  - Direct contract calls
- **Configuration:**
  ```env
  IS_VAULT_ENABLED=false
  # or
  CUSTODIAN_PROVIDER=local
  ```
- **Use Case:** Direct smart contract interaction

## 🔧 Implementation Process

To implement a new custodian:

1. **Create Implementation File**
   - Create file: `src/shared/custodian/implementations/{provider}.custodian.ts`
   - Implement `ICustodian` interface

2. **Add to Factory**
   - Update `custodian.factory.ts` to include new provider
   - Add case in `createCustodian()` method

3. **Add to Enum**
   - Add provider to `CustodianProvider` enum if new

4. **Update Configuration**
   - Add environment variables to `env.example`
   - Document configuration in this file

5. **Test Implementation**
   - Test all interface methods
   - Verify transaction flow
   - Test error handling

## 📝 Configuration Example

```env
# Enable custodian
IS_VAULT_ENABLED=true

# Select provider
CUSTODIAN_PROVIDER=fireblocks

# Provider-specific configuration
VAULT_API_KEY=your_key
VAULT_API_SECRET_KEY_PATH=./secret.key
```

## 🔄 Switching Providers

To switch between providers, simply change the `CUSTODIAN_PROVIDER` environment variable:

```env
# Switch to BitGo
CUSTODIAN_PROVIDER=bitgo
BITGO_API_KEY=...
BITGO_API_SECRET=...

# Switch to Coinbase
CUSTODIAN_PROVIDER=coinbase_custody
COINBASE_API_KEY=...
COINBASE_API_SECRET=...

# Switch to Anchorage
CUSTODIAN_PROVIDER=anchorage
# Configuration TBD when implemented

# Switch to Fidelity
CUSTODIAN_PROVIDER=fidelity
# Configuration TBD when implemented
```

The factory will automatically create the appropriate custodian instance.
