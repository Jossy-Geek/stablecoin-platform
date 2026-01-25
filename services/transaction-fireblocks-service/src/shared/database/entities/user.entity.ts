import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'display_id' })
  displayId: string;

  @Column()
  email: string;

  @Column({ nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, name: 'mobile_number' })
  mobileNumber: string;

  @Column({ nullable: true, name: 'country_code' })
  countryCode: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn({ name: 'synced_at' })
  syncedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
