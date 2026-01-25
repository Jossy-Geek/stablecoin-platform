import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('two_factor_auth')
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.twoFactorAuth)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'secret' })
  secret: string;

  @Column({ type: 'text', nullable: true, name: 'backup_codes' })
  backupCodes: string; // JSON array as string

  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
