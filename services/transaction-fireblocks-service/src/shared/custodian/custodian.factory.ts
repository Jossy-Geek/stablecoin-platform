import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICustodian } from './interfaces/custodian.interface';
import { CustodianProvider } from './custodian-provider.enum';
import { FireblocksCustodian } from './implementations/fireblocks.custodian';
import { BitGoCustodian } from './implementations/bitgo.custodian';
import { CoinbaseCustodian } from './implementations/coinbase.custodian';
import { MockCustodian } from './implementations/mock.custodian';
import { LocalCustodian } from './implementations/local.custodian';

/**
 * Custodian Factory
 * 
 * Creates and manages custodian instances based on configuration.
 * This factory pattern allows switching between different custodian providers
 * without changing the business logic.
 */
@Injectable()
export class CustodianFactory {
  private readonly logger = new Logger(CustodianFactory.name);
  private custodianInstance: ICustodian | null = null;
  private currentProvider: CustodianProvider | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Get the configured custodian instance
   * Creates a new instance if not already created or if provider changed
   */
  getCustodian(): ICustodian | null {
    const configuredProvider = this.getConfiguredProvider();

    // Return null if custodian is disabled
    if (configuredProvider === null) {
      return null;
    }

    // Return existing instance if provider hasn't changed
    if (this.custodianInstance && this.currentProvider === configuredProvider) {
      return this.custodianInstance;
    }

    // Create new instance for the configured provider
    this.custodianInstance = this.createCustodian(configuredProvider);
    this.currentProvider = configuredProvider;

    return this.custodianInstance;
  }

  /**
   * Get the configured custodian provider from environment
   */
  private getConfiguredProvider(): CustodianProvider | null {
    const isVaultEnabled = this.configService.get('IS_VAULT_ENABLED', 'false') === 'true';
    
    if (!isVaultEnabled) {
      return null;
    }

    const provider = this.configService.get<string>('CUSTODIAN_PROVIDER', 'fireblocks').toLowerCase();

    // Map string to enum
    switch (provider) {
      case 'fireblocks':
        return CustodianProvider.FIREBLOCKS;
      case 'bitgo':
        return CustodianProvider.BITGO;
      case 'coinbase':
      case 'coinbase_custody':
        return CustodianProvider.COINBASE_CUSTODY;
      case 'anchorage':
        return CustodianProvider.ANCHORAGE;
      case 'fidelity':
        return CustodianProvider.FIDELITY;
      case 'mock':
        return CustodianProvider.MOCK;
      case 'local':
        return CustodianProvider.LOCAL;
      default:
        this.logger.warn(`Unknown custodian provider: ${provider}. Defaulting to Fireblocks.`);
        return CustodianProvider.FIREBLOCKS;
    }
  }

  /**
   * Create custodian instance based on provider
   */
  private createCustodian(provider: CustodianProvider): ICustodian {
    this.logger.log(`Creating custodian instance for provider: ${provider}`);

    switch (provider) {
      case CustodianProvider.FIREBLOCKS:
        return new FireblocksCustodian(this.configService);

      case CustodianProvider.BITGO:
        return new BitGoCustodian(this.configService);

      case CustodianProvider.COINBASE_CUSTODY:
        return new CoinbaseCustodian(this.configService);

      case CustodianProvider.MOCK:
        return new MockCustodian(this.configService);

      case CustodianProvider.LOCAL:
        return new LocalCustodian(this.configService);

      // Placeholder implementations for other providers
      // These would need actual SDK integrations
      case CustodianProvider.ANCHORAGE:
      case CustodianProvider.FIDELITY:
        this.logger.warn(
          `Provider ${provider} is not yet implemented. Using Mock custodian as fallback.`,
        );
        return new MockCustodian(this.configService);

      default:
        this.logger.error(`Unsupported custodian provider: ${provider}`);
        throw new Error(`Unsupported custodian provider: ${provider}`);
    }
  }

  /**
   * Get current provider name
   */
  getCurrentProvider(): string | null {
    return this.currentProvider || null;
  }

  /**
   * Check if custodian is enabled and initialized
   */
  isCustodianEnabled(): boolean {
    return this.getCustodian() !== null && this.getCustodian()?.isInitialized() === true;
  }
}
