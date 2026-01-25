import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractState } from '../../shared/database/entities/contract-state.entity';

@Injectable()
export class ContractRepository {
  constructor(
    @InjectRepository(ContractState)
    private readonly repository: Repository<ContractState>,
  ) {}

  async findAll(): Promise<ContractState[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<ContractState | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByAddress(contractAddress: string): Promise<ContractState | null> {
    return this.repository.findOne({ where: { contractAddress } });
  }

  async create(data: Partial<ContractState>): Promise<ContractState> {
    const contract = this.repository.create(data);
    return this.repository.save(contract);
  }

  async update(id: string, data: Partial<ContractState>): Promise<ContractState> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async updateByAddress(contractAddress: string, data: Partial<ContractState>): Promise<ContractState> {
    await this.repository.update({ contractAddress }, data);
    return this.findByAddress(contractAddress);
  }

  async togglePause(id: string, isPaused: boolean): Promise<ContractState> {
    await this.repository.update(id, { isPaused, lastSyncedAt: new Date() });
    return this.findById(id);
  }

  async togglePauseByAddress(contractAddress: string, isPaused: boolean): Promise<ContractState> {
    await this.repository.update({ contractAddress }, { isPaused, lastSyncedAt: new Date() });
    return this.findByAddress(contractAddress);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
