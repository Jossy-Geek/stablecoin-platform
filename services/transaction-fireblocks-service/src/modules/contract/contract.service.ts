import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContractRepository } from './contract.repository';
import { CreateContractDto, UpdateContractDto, TogglePauseDto } from './dto/contract.dto';
import { ContractState } from '../../shared/database/entities/contract-state.entity';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private readonly isMockMode: boolean;

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly configService: ConfigService,
  ) {
    this.isMockMode = this.configService.get('IS_MOCK', 'false') === 'true';
    if (this.isMockMode) {
      this.logger.warn('⚠️  MOCK MODE ENABLED - Using mock data instead of database');
    }
  }

  async getAllContracts(): Promise<ContractState[]> {
    if (this.isMockMode) {
      return this.getMockContracts();
    }
    return this.contractRepository.findAll();
  }

  async getContractById(id: string): Promise<ContractState> {
    if (this.isMockMode) {
      const contracts = this.getMockContracts();
      const contract = contracts.find(c => c.id === id);
      if (!contract) {
        throw new NotFoundException('Contract not found');
      }
      return contract;
    }

    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async getContractByAddress(contractAddress: string): Promise<ContractState> {
    if (this.isMockMode) {
      const contracts = this.getMockContracts();
      const contract = contracts.find(c => c.contractAddress.toLowerCase() === contractAddress.toLowerCase());
      if (!contract) {
        throw new NotFoundException('Contract not found');
      }
      return contract;
    }

    const contract = await this.contractRepository.findByAddress(contractAddress);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async createContract(createDto: CreateContractDto): Promise<ContractState> {
    if (this.isMockMode) {
      return {
        id: 'c0000000-0000-0000-0000-000000000999',
        ...createDto,
        isPaused: false,
        totalSupply: createDto.totalSupply || '0',
        deployedAt: createDto.deployedAt || new Date(),
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ContractState;
    }

    // Check if contract already exists
    const existing = await this.contractRepository.findByAddress(createDto.contractAddress);
    if (existing) {
      throw new ConflictException('Contract with this address already exists');
    }

    return this.contractRepository.create({
      ...createDto,
      totalSupply: createDto.totalSupply || '0',
      deployedAt: createDto.deployedAt || new Date(),
      lastSyncedAt: new Date(),
    });
  }

  async updateContract(id: string, updateDto: UpdateContractDto): Promise<ContractState> {
    if (this.isMockMode) {
      const contracts = this.getMockContracts();
      const contract = contracts.find(c => c.id === id);
      if (!contract) {
        throw new NotFoundException('Contract not found');
      }
      return { ...contract, ...updateDto, updatedAt: new Date() } as ContractState;
    }

    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return this.contractRepository.update(id, {
      ...updateDto,
      lastSyncedAt: new Date(),
    });
  }

  async togglePause(id: string, toggleDto: TogglePauseDto): Promise<ContractState> {
    if (this.isMockMode) {
      const contracts = this.getMockContracts();
      const contract = contracts.find(c => c.id === id);
      if (!contract) {
        throw new NotFoundException('Contract not found');
      }
      return { ...contract, isPaused: toggleDto.isPaused, updatedAt: new Date() } as ContractState;
    }

    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    this.logger.log(`Toggling contract pause status: ${contract.contractAddress} -> ${toggleDto.isPaused ? 'PAUSED' : 'RESUMED'}`);

    return this.contractRepository.togglePause(id, toggleDto.isPaused);
  }

  async togglePauseByAddress(contractAddress: string, toggleDto: TogglePauseDto): Promise<ContractState> {
    if (this.isMockMode) {
      const contracts = this.getMockContracts();
      const contract = contracts.find(c => c.contractAddress.toLowerCase() === contractAddress.toLowerCase());
      if (!contract) {
        throw new NotFoundException('Contract not found');
      }
      return { ...contract, isPaused: toggleDto.isPaused, updatedAt: new Date() } as ContractState;
    }

    const contract = await this.contractRepository.findByAddress(contractAddress);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    this.logger.log(`Toggling contract pause status: ${contractAddress} -> ${toggleDto.isPaused ? 'PAUSED' : 'RESUMED'}`);

    return this.contractRepository.togglePauseByAddress(contractAddress, toggleDto.isPaused);
  }

  async deleteContract(id: string): Promise<void> {
    if (this.isMockMode) {
      return;
    }

    const contract = await this.contractRepository.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    await this.contractRepository.delete(id);
  }

  private getMockContracts(): ContractState[] {
    return [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        contractAddress: '0x1234567890123456789012345678901234567890',
        contractName: 'StablecoinToken',
        network: 'ethereum',
        isPaused: false,
        totalSupply: '1000000.00',
        deployedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastSyncedAt: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        contractAddress: '0x9876543210987654321098765432109876543210',
        contractName: 'StablecoinToken',
        network: 'polygon',
        isPaused: true,
        totalSupply: '500000.00',
        deployedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        lastSyncedAt: new Date(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
  }
}
