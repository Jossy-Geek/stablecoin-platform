import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { PasswordReset } from './password-reset.entity';
import { TwoFactorAuth } from './two-factor-auth.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true, name: 'display_id' })
  displayId: string;

  @Column({ type: 'varchar', length: 255, name: 'email' })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, name: 'mobile_number' })
  mobileNumber: string;

  @Column({ nullable: true, name: 'country_code' })
  countryCode: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'profile_image', select: false })
  profileImage: string;

  @Column({ default: false, name: 'is_two_factor_enabled' })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true, name: 'two_factor_secret' })
  twoFactorSecret: string;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles: UserRoleEntity[];

  @OneToOne(() => PasswordReset, (passwordReset) => passwordReset.user)
  passwordReset: PasswordReset;

  @OneToOne(() => TwoFactorAuth, (twoFactorAuth) => twoFactorAuth.user)
  twoFactorAuth: TwoFactorAuth;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Helper method to get active roles
  getActiveRoles(): UserRoleEntity[] {
    return this.userRoles?.filter((ur) => ur.isActive && !ur.isBlocked) || [];
  }

  // Helper method to check if user has a specific role
  hasRole(role: string): boolean {
    return this.getActiveRoles().some((ur) => ur.role === role);
  }
}
