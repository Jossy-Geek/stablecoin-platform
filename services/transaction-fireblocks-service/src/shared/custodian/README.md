# Custodian Abstraction System

This module provides a flexible, provider-agnostic custodian abstraction system that allows switching between different blockchain custody providers without changing business logic.

## 🏗️ Architecture

### Interface-Based Design
- **`ICustodian`**: Common interface that all custodian implementations must follow
- **`CustodianFactory`**: Factory pattern for creating custodian instances
- **Provider Implementations**: Specific implementations for each custodian provider

### Key Components

```
custodian/
├── interfaces/
│   └── custodian.interface.ts      # ICustodian interface
├── implementations/
│   ├── fireblocks.custodian.ts      # Fireblocks implementation
│   ├── bitgo.custodian.ts           # BitGo implementation
│   ├── coinbase.custodian.ts        # Coinbase implementation
│   ├── mock.custodian.ts            # Mock for testing
│   └── local.custodian.ts           # Direct blockchain interaction
├── custodian-provider.enum.ts       # Supported providers enum
├── custodian.factory.ts             # Factory for creating instances
├── custodian.module.ts              # NestJS module
└── README.md                        # This file
```

## 🚀 Usage

### 1. Import the Module

```typescript
import { CustodianModule } from '../../shared/custodian/custodian.module';

@Module({
  imports: [CustodianModule],
  // ...
})
export class YourModule {}
```

### 2. Inject the Factory

```typescript
import { CustodianFactory } from '../../shared/custodian/custodian.factory';

@Injectable()
export class YourService {
  constructor(private custodianFactory: CustodianFactory) {}

  async someMethod() {
    const custodian = this.custodianFactory.getCustodian();
    
    if (!custodian) {
      // Custodian not enabled
      return;
    }

    // Use custodian
    const balance = await custodian.getVaultAssetBalance(vaultId, assetId);
  }
}
```

### 3. Configure Provider

Set in `.env`:
```env
IS_VAULT_ENABLED=true
CUSTODIAN_PROVIDER=fireblocks
```

## 📋 Supported Operations

All custodians implement these operations:

- `getVaultAssetBalance()` - Get balance for a vault account
- `checkVaultBalance()` - Check if sufficient balance exists
- `verifyWebhookSignature()` - Verify webhook authenticity
- `calculateGasFee()` - Estimate transaction gas fees
- `submitTransaction()` - Submit transaction to custodian
- `getTransactionStatus()` - Get transaction status
- `createVaultAccount()` - Create new vault account
- `getVaultAccount()` - Get vault account details

## 🔄 Adding a New Custodian

1. **Create Implementation Class**

```typescript
import { ICustodian } from '../interfaces/custodian.interface';

export class NewCustodian implements ICustodian {
  getProviderName(): string {
    return 'new_custodian';
  }

  isInitialized(): boolean {
    // Check initialization
  }

  // Implement all interface methods...
}
```

2. **Add to Factory**

```typescript
// In custodian.factory.ts
case CustodianProvider.NEW_CUSTODIAN:
  return new NewCustodian(this.configService);
```

3. **Add Environment Variables**

```env
NEW_CUSTODIAN_API_KEY=
NEW_CUSTODIAN_API_SECRET=
```

## 🎯 Benefits

1. **Flexibility**: Switch providers via configuration
2. **Testability**: Mock custodian for testing
3. **Extensibility**: Easy to add new providers
4. **Maintainability**: Single interface, multiple implementations
5. **No Vendor Lock-in**: Business logic independent of provider

## 📚 See Also

- `CUSTODIAN_PROVIDERS.md` - List of all supported providers
- `custodian.interface.ts` - Interface documentation
- `custodian-provider.enum.ts` - Available providers
