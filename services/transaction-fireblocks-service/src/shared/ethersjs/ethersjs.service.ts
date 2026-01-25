import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as fs from 'fs';

@Injectable()
export class EthersService {
  private readonly logger = new Logger(EthersService.name);
  private provider: ethers.Provider;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private contractABI: any;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get('ETHEREUM_RPC_URL', 'http://localhost:8545');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = this.configService.get('CONTRACT_ADDRESS', '');

    // Load contract ABI
    const abiPath = this.configService.get('CONTRACT_ABI_PATH');
    if (abiPath && fs.existsSync(abiPath)) {
      try {
        const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        this.contractABI = contractData.abi || contractData;
        this.logger.log('Contract ABI loaded');
      } catch (error) {
        this.logger.error(`Error loading contract ABI: ${error.message}`);
      }
    }

    // Initialize contract if address and ABI are available
    if (this.contractAddress && this.contractABI) {
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.provider,
      );
      this.logger.log(`Contract initialized at ${this.contractAddress}`);
    }
  }

  /**
   * Get contract instance
   */
  getContract(): ethers.Contract | null {
    return this.contract;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Create contract instance with signer
   */
  getContractWithSigner(privateKey: string): ethers.Contract | null {
    if (!this.contractAddress || !this.contractABI) {
      return null;
    }

    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(this.contractAddress, this.contractABI, wallet);
  }

  /**
   * Encode mint function call
   */
  encodeMintFunction(to: string, amount: string): string {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const amountWei = ethers.parseEther(amount);
    return this.contract.interface.encodeFunctionData('mint', [to, amountWei]);
  }

  /**
   * Encode burn function call
   */
  encodeBurnFunction(from: string, amount: string): string {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const amountWei = ethers.parseEther(amount);
    return this.contract.interface.encodeFunctionData('burn', [from, amountWei]);
  }

  /**
   * Get user balance from contract
   */
  async getUserBalance(userAddress: string): Promise<string> {
    if (!this.contract) {
      return '0';
    }

    try {
      const balance = await this.contract.getUserBalance(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Error getting user balance: ${error.message}`);
      return '0';
    }
  }

  /**
   * Get total supply
   */
  async getTotalSupply(): Promise<string> {
    if (!this.contract) {
      return '0';
    }

    try {
      const supply = await this.contract.totalSupply();
      return ethers.formatEther(supply);
    } catch (error) {
      this.logger.error(`Error getting total supply: ${error.message}`);
      return '0';
    }
  }
}
