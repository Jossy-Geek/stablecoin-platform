# Custodian Implementation Guide

This guide explains how to implement a new custodian provider in the system.

## 📋 Implementation Checklist

### Step 1: Research the Custodian
- [ ] Review custodian's API documentation
- [ ] Check available SDKs or REST APIs
- [ ] Understand authentication mechanism
- [ ] Review transaction submission flow
- [ ] Check webhook/event system
- [ ] Review pricing and rate limits

### Step 2: Create Implementation File
Create a new file: `src/shared/custodian/implementations/{provider}.custodian.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICustodian, TransactionOptions, TransactionResult } from '../interfaces/custodian.interface';
import { CustodianProvider } from '../custodian-provider.enum';

@Injectable()
export class NewCustodian implements ICustodian {
  private readonly logger = new Logger(NewCustodian.name);
  private initialized: boolean = false;
  private client: any; // Replace with actual SDK type

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // 1. Get credentials from config
      const apiKey = this.configService.get('NEW_CUSTODIAN_API_KEY');
      const apiSecret = this.configService.get('NEW_CUSTODIAN_API_SECRET');

      if (!apiKey || !apiSecret) {
        this.logger.warn('NewCustodian credentials not configured');
        return;
      }

      // 2. Initialize SDK/client
      // this.client = new NewCustodianSDK({ apiKey, apiSecret });

      // 3. Test connection
      // await this.client.ping();

      this.initialized = true;
      this.logger.log('✅ NewCustodian initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize NewCustodian:', error);
      this.initialized = false;
    }
  }

  getProviderName(): string {
    return CustodianProvider.NEW_CUSTODIAN; // Add to enum first
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Implement all interface methods...
}
```

### Step 3: Add to Enum
Update `custodian-provider.enum.ts`:

```typescript
export enum CustodianProvider {
  // ... existing providers
  NEW_CUSTODIAN = 'new_custodian',
}
```

### Step 4: Add to Factory
Update `custodian.factory.ts`:

```typescript
import { NewCustodian } from './implementations/new.custodian';

// In getConfiguredProvider():
case 'new_custodian':
  return CustodianProvider.NEW_CUSTODIAN;

// In createCustodian():
case CustodianProvider.NEW_CUSTODIAN:
  return new NewCustodian(this.configService);
```

### Step 5: Add Environment Variables
Update `env.example`:

```env
# New Custodian Configuration (when CUSTODIAN_PROVIDER=new_custodian)
NEW_CUSTODIAN_API_KEY=
NEW_CUSTODIAN_API_SECRET=
NEW_CUSTODIAN_ENVIRONMENT=test  # or 'prod'
```

### Step 6: Install Dependencies
Add SDK to `package.json`:

```bash
npm install new-custodian-sdk
# or
npm install @newcustodian/api-client
```

### Step 7: Implement Interface Methods

#### Required Methods:

1. **`getVaultAssetBalance()`**
   ```typescript
   async getVaultAssetBalance(vaultAccountId: string, assetId: string): Promise<string> {
     const balance = await this.client.getBalance(vaultAccountId, assetId);
     return balance.total || '0';
   }
   ```

2. **`checkVaultBalance()`**
   ```typescript
   async checkVaultBalance(vaultAccountId: string, assetId: string, txGasFee: string, tokenAmount?: string): Promise<boolean> {
     const balance = await this.getVaultAssetBalance(vaultAccountId, assetId);
     const balanceNum = parseFloat(balance);
     const gasFeeNum = parseFloat(txGasFee);
     const tokenAmountNum = tokenAmount ? parseFloat(tokenAmount) : 0;
     return balanceNum >= gasFeeNum + tokenAmountNum;
   }
   ```

3. **`verifyWebhookSignature()`**
   ```typescript
   async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
     // Use custodian's webhook verification method
     return this.client.verifyWebhook(payload, signature);
   }
   ```

4. **`calculateGasFee()`**
   ```typescript
   async calculateGasFee(txOptions: TransactionOptions): Promise<string> {
     const estimate = await this.client.estimateGas(txOptions);
     return estimate.gasFee || '0.0001';
   }
   ```

5. **`submitTransaction()`**
   ```typescript
   async submitTransaction(txOptions: TransactionOptions): Promise<TransactionResult> {
     const tx = await this.client.createTransaction(txOptions);
     return {
       id: tx.id,
       status: tx.status,
       txHash: tx.hash,
       ...tx,
     };
   }
   ```

6. **`getTransactionStatus()`**
   ```typescript
   async getTransactionStatus(transactionId: string): Promise<TransactionResult> {
     const tx = await this.client.getTransaction(transactionId);
     return {
       id: tx.id,
       status: tx.status,
       txHash: tx.hash,
       ...tx,
     };
   }
   ```

7. **`createVaultAccount()`**
   ```typescript
   async createVaultAccount(userId: string, customerRefId?: string): Promise<{ vaultAccountId: string; address?: string }> {
     const account = await this.client.createAccount({
       name: customerRefId || userId,
       userId,
     });
     return {
       vaultAccountId: account.id,
       address: account.address,
     };
   }
   ```

8. **`getVaultAccount()`**
   ```typescript
   async getVaultAccount(vaultAccountId: string): Promise<any> {
     return await this.client.getAccount(vaultAccountId);
   }
   ```

### Step 8: Update Documentation
- [ ] Add provider to `CUSTODIAN_PROVIDERS.md`
- [ ] Update status to "Implemented"
- [ ] Add configuration examples
- [ ] Document any provider-specific features

### Step 9: Testing
- [ ] Unit tests for all methods
- [ ] Integration tests with test credentials
- [ ] Test error handling
- [ ] Test webhook verification
- [ ] Test transaction flow end-to-end

### Step 10: Error Handling
Ensure proper error handling:

```typescript
try {
  // Implementation
} catch (error) {
  this.logger.error(`Error in method: ${error.message}`, error.stack);
  throw error; // Or return default value
}
```

## 🔍 Common Implementation Patterns

### Authentication
Most custodians use:
- API Key + Secret
- OAuth2
- JWT tokens
- Certificate-based

### Transaction Submission
Common patterns:
1. Create transaction → Get transaction ID
2. Sign transaction (if required)
3. Submit transaction
4. Poll for status or use webhooks

### Webhook Verification
Most custodians provide:
- HMAC signature
- Public key verification
- Timestamp validation

## 📚 Example: BitGo Implementation

See `bitgo.custodian.ts` for a reference implementation structure.

## ⚠️ Important Notes

1. **Error Handling**: Always handle errors gracefully
2. **Logging**: Log important operations for debugging
3. **Type Safety**: Use proper TypeScript types
4. **Configuration**: Use ConfigService for all credentials
5. **Initialization**: Check initialization before operations
6. **Testing**: Test with mock/test credentials first

## 🚀 Quick Start Template

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICustodian, TransactionOptions, TransactionResult } from '../interfaces/custodian.interface';
import { CustodianProvider } from '../custodian-provider.enum';

@Injectable()
export class TemplateCustodian implements ICustodian {
  private readonly logger = new Logger(TemplateCustodian.name);
  private initialized: boolean = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // TODO: Initialize SDK
    this.initialized = true;
  }

  getProviderName(): string {
    return CustodianProvider.TEMPLATE;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // TODO: Implement all interface methods
}
```
