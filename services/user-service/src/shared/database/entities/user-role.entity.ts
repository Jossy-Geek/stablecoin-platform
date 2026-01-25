import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users_roles')
@Unique(['userId', 'role'])
export class UserRoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'role',
  })
  role: UserRole;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'is_blocked' })
  isBlocked: boolean;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
