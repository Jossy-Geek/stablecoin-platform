import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  MINT = 'mint',
  BURN = 'burn',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  BROADCASTING = 'broadcasting',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true, name: 'parent_id' })
  parentId: string; // For burn transactions

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('uuid', { nullable: true, name: 'deposit_address_id' })
  depositAddressId: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'transaction_type',
  })
  transactionType: TransactionType;

  @Column('decimal', { precision: 36, scale: 18 })
  amount: string;

  @Column('decimal', { precision: 36, scale: 18, nullable: true, name: 'amount_requested' })
  amountRequested: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'to_currency' })
  toCurrency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'txn_id' })
  txnId: string; // Fireblocks transaction ID

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'tx_hash' })
  txHash: string; // Blockchain transaction hash

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'source_address' })
  sourceAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'destination_address' })
  destinationAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'source_type' })
  sourceType: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'destination_type' })
  destinationType: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'vault_account_id' })
  vaultAccountId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'asset_id' })
  assetId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'text', nullable: true, name: 'failure_reason' })
  failureReason: string;

  @Column({ type: 'integer', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column('decimal', { precision: 36, scale: 18, nullable: true })
  fee: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'fee_currency' })
  feeCurrency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
