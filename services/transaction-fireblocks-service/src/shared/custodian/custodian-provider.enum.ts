/**
 * Supported Custodian Providers
 * 
 * This enum lists the top 5 supported custodian providers that can be used
 * as alternatives to Fireblocks, plus Mock and Local options for testing/development.
 * 
 * Top 5 custodians selected based on industry standards, regulatory compliance,
 * and implementation status: Fireblocks, BitGo, Coinbase Custody, Anchorage Digital, Fidelity Digital Assets.
 */

export enum CustodianProvider {
  /**
   * Fireblocks - Enterprise-grade digital asset custody
   * Features: MPC, multi-chain support, DeFi integrations
   */
  FIREBLOCKS = 'fireblocks',

  /**
   * BitGo - Institutional digital asset custody
   * Features: Multi-sig, cold storage, insurance coverage
   */
  BITGO = 'bitgo',

  /**
   * Coinbase Custody - Institutional custody service
   * Features: Cold storage, insurance, regulatory compliance
   */
  COINBASE_CUSTODY = 'coinbase_custody',

  /**
   * Anchorage Digital - Federally chartered crypto bank
   * Features: OCC-chartered, staking, settlement services
   */
  ANCHORAGE = 'anchorage',

  /**
   * Fidelity Digital Assets - Traditional finance pedigree
   * Features: Cold storage, MPC workflows, strong governance
   */
  FIDELITY = 'fidelity',

  /**
   * Mock/Test - For development and testing
   * Features: Simulated responses, no real transactions
   */
  MOCK = 'mock',

  /**
   * Local - Direct blockchain interaction
   * Features: No custodian, direct contract calls
   */
  LOCAL = 'local',
}
