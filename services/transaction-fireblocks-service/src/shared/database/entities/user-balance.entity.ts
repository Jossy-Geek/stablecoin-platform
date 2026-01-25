import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('user_balances')
@Unique(['userId'])
export class UserBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @Column('decimal', { precision: 36, scale: 18, default: '0' })
  balance: string;

  @Column('decimal', { precision: 36, scale: 18, default: '0', name: 'stablecoin_balance' })
  stablecoinBalance: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
