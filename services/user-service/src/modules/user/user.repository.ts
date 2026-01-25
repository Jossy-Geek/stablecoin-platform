import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/database/entities/user.entity';

export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  displayId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  mobileNumber?: string;
  active?: boolean;
}

export interface PaginatedUsersResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Find user by ID with relations
   */
  async findById(id: string, relations?: string[]): Promise<User | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.id = :id', { id });

    return queryBuilder.getOne();
  }

  /**
   * Find user by email with relations
   */
  async findByEmail(email: string, relations?: string[]): Promise<User | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // Explicitly select passwordHash for authentication
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.email = :email', { email });

    return queryBuilder.getOne();
  }

  /**
   * Find user by display ID
   */
  async findByDisplayId(displayId: string): Promise<User | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .where('user.displayId = :displayId', { displayId });

    return queryBuilder.getOne();
  }

  /**
   * Create new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  /**
   * Update user
   */
  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * Save user (create or update)
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Get users list with pagination and column-specific filters
   */
  async findWithPagination(options: PaginationOptions): Promise<PaginatedUsersResult> {
    const {
      page,
      limit,
      search,
      role,
      displayId,
      email,
      firstName,
      lastName,
      countryCode,
      mobileNumber,
      active,
    } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    // Apply general search filter (searches across multiple fields)
    if (search) {
      queryBuilder.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.displayId ILIKE :search OR user.mobileNumber ILIKE :search OR user.countryCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply column-specific filters
    if (displayId) {
      queryBuilder.andWhere('user.displayId ILIKE :displayId', {
        displayId: `%${displayId}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (firstName) {
      queryBuilder.andWhere('user.firstName ILIKE :firstName', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('user.lastName ILIKE :lastName', {
        lastName: `%${lastName}%`,
      });
    }

    if (countryCode) {
      queryBuilder.andWhere('user.countryCode ILIKE :countryCode', {
        countryCode: `%${countryCode}%`,
      });
    }

    if (mobileNumber) {
      queryBuilder.andWhere('user.mobileNumber ILIKE :mobileNumber', {
        mobileNumber: `%${mobileNumber}%`,
      });
    }

    // Apply active filter (checks active roles from users_roles table)
    if (active !== undefined) {
      if (active) {
        // User is active if they have at least one active, non-blocked role
        queryBuilder.andWhere('userRoles.isActive = :isActive', { isActive: true });
        queryBuilder.andWhere('userRoles.isBlocked = :isBlocked', { isBlocked: false });
      } else {
        // User is inactive if all roles are inactive or blocked
        queryBuilder.andWhere(
          '(userRoles.isActive = :isActive OR userRoles.isBlocked = :isBlocked)',
          {
            isActive: false,
            isBlocked: true,
          },
        );
      }
    }

    // Apply role filter
    if (role) {
      if (role === 'admin') {
        // For admin role, fetch both admin and super_admin
        queryBuilder.andWhere('(userRoles.role = :adminRole OR userRoles.role = :superAdminRole)', {
          adminRole: 'admin',
          superAdminRole: 'super_admin',
        });
      } else {
        queryBuilder.andWhere('userRoles.role = :role', { role });
      }
      queryBuilder.andWhere('userRoles.isActive = :isActive', { isActive: true });
      queryBuilder.andWhere('userRoles.isBlocked = :isBlocked', { isBlocked: false });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if display ID exists
   */
  async displayIdExists(displayId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { displayId } });
    return count > 0;
  }
}
