import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contract_state')
export class ContractState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42, unique: true, name: 'contract_address' })
  contractAddress: string;

  @Column({ type: 'varchar', length: 100, name: 'contract_name' })
  contractName: string;

  @Column({ type: 'varchar', length: 50 })
  network: string;

  @Column({ type: 'boolean', default: false, name: 'is_paused' })
  isPaused: boolean;

  @Column('decimal', { precision: 36, scale: 18, default: 0, name: 'total_supply' })
  totalSupply: string;

  @Column({ type: 'timestamp', nullable: true, name: 'deployed_at' })
  deployedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'last_synced_at' })
  lastSyncedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
