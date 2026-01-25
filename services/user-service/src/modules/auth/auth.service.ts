import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { User } from '../../shared/database/entities/user.entity';
import { UserRoleEntity, UserRole } from '../../shared/database/entities/user-role.entity';
import { PasswordReset } from '../../shared/database/entities/password-reset.entity';
import { TwoFactorAuth } from '../../shared/database/entities/two-factor-auth.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { RabbitMQService } from '../../shared/rabbitmq/rabbitmq.service';
import { RedisService } from '../../shared/redis/redis.service';
import { DisplayIdService } from '../../shared/services/display-id.service';
import { TokenWhitelistService } from '../../shared/auth/token-whitelist.service';
import { UserRepository } from '../user/user.repository';
import { UserRoleRepository } from './user-role.repository';
import { PasswordResetRepository } from './password-reset.repository';
import { TwoFactorAuthRepository } from './two-factor-auth.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isCaptchaEnabled: boolean;
  private readonly recaptchaSecretKey: string;

  constructor(
    private userRepository: UserRepository,
    private userRoleRepository: UserRoleRepository,
    private passwordResetRepository: PasswordResetRepository,
    private twoFactorAuthRepository: TwoFactorAuthRepository,
    private jwtService: JwtService,
    private kafkaService: KafkaService,
    private rabbitMQService: RabbitMQService,
    private redisService: RedisService,
    private dataSource: DataSource,
    private displayIdService: DisplayIdService,
    private configService: ConfigService,
    private tokenWhitelistService: TokenWhitelistService,
  ) {
    this.isCaptchaEnabled = this.configService.get('IS_CAPTCHA', 'false') === 'true';
    this.recaptchaSecretKey = this.configService.get('RECAPTCHA_SECRET_KEY', '');
    
    if (this.isCaptchaEnabled) {
      this.logger.log('✅ CAPTCHA validation enabled');
    } else {
      this.logger.log('ℹ️  CAPTCHA validation disabled');
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, mobileNumber, countryCode, captchaToken } = registerDto;

    // Validate captcha if enabled
    if (this.isCaptchaEnabled) {
      if (!captchaToken) {
        throw new BadRequestException('Captcha token is required');
      }
      
      try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: {
            secret: this.recaptchaSecretKey,
            response: captchaToken,
          },
        });

        if (!response.data.success) {
          throw new BadRequestException('Invalid captcha verification');
        }
      } catch (error) {
        this.logger.error('Captcha verification failed:', error);
        throw new BadRequestException('Captcha verification failed');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists with this email
      let user = await queryRunner.manager.findOne(User, {
        where: { email },
        relations: ['userRoles'],
      });

      if (user) {
        // User exists, check if user role already exists
        const existingUserRole = await queryRunner.manager.findOne(UserRoleEntity, {
          where: { userId: user.id, role: UserRole.USER },
        });

        if (existingUserRole) {
          throw new BadRequestException('User with this email already has user role');
        }

        // Add user role to existing user
        const userRole = queryRunner.manager.create(UserRoleEntity, {
          userId: user.id,
          role: UserRole.USER,
          isActive: true,
          isBlocked: false,
        });
        await queryRunner.manager.save(userRole);
      } else {
        // Generate unique display ID
        const displayId = await this.displayIdService.generateUniqueDisplayId();
        
        // Create new user
        user = queryRunner.manager.create(User, {
          displayId,
          email,
          passwordHash,
          firstName,
          lastName,
          mobileNumber,
          countryCode,
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create user role
        const userRole = queryRunner.manager.create(UserRoleEntity, {
          userId: savedUser.id,
          role: UserRole.USER,
          isActive: true,
          isBlocked: false,
        });
        await queryRunner.manager.save(userRole);
      }

      await queryRunner.commitTransaction();

      // Emit user.created event for each role
      const userRoles = await this.userRoleRepository.findActiveRolesByUserId(user.id);

      for (const userRole of userRoles) {
        await this.kafkaService.emit('user.created', {
          userId: user.id,
          displayId: user.displayId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          countryCode: user.countryCode,
          role: userRole.role,
          timestamp: new Date().toISOString(),
        });
      }

      // Send welcome email via RabbitMQ
      await this.rabbitMQService.publish('email-notifications', {
        to: user.email,
        subject: 'Welcome to Stablecoin Platform',
        template: 'welcome',
        data: {
          name: user.fullName,
        },
      });

      return {
        message: 'User registered successfully',
        userId: user.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Admin login - validates credentials and checks if user has admin or super_admin role
   */
  async adminLogin(loginDto: LoginDto) {
    const { email, password, captchaToken } = loginDto;

    // Validate captcha if enabled
    if (this.isCaptchaEnabled) {
      if (!captchaToken) {
        throw new BadRequestException('Captcha token is required');
      }
      
      try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: {
            secret: this.recaptchaSecretKey,
            response: captchaToken,
          },
        });

        if (!response.data.success) {
          throw new BadRequestException('Invalid captcha verification');
        }
      } catch (error) {
        this.logger.error('Captcha verification failed:', error);
        throw new BadRequestException('Captcha verification failed');
      }
    }

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Admin login attempt failed: User not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.passwordHash) {
      this.logger.error(`User ${user.id} has no password hash`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Admin login attempt failed: Invalid password for user ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get active, non-blocked roles
    const activeRoles = user.getActiveRoles();

    if (activeRoles.length === 0) {
      this.logger.warn(`Admin login attempt failed: No active roles for user ${email}`);
      throw new UnauthorizedException('No active roles found for this user');
    }

    // Check if user has admin or super_admin role
    const adminRole = activeRoles.find((ur) => ur.role === UserRole.ADMIN || ur.role === UserRole.SUPER_ADMIN);
    
    if (!adminRole) {
      this.logger.warn(`Admin login attempt failed: User ${email} does not have admin/super_admin role`);
      throw new UnauthorizedException('User does not have admin or super_admin role');
    }

    this.logger.log(`Admin login successful for user: ${email} with role: ${adminRole.role}`);

    // Prefer super_admin over admin if user has both
    const selectedRole = activeRoles.find((ur) => ur.role === UserRole.SUPER_ADMIN) || adminRole;

    // If 2FA is enabled, return temp token for 2FA verification
    if (user.isTwoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { userId: user.id, email: user.email, role: selectedRole.role, temp: true },
        { expiresIn: '5m' },
      );

      // Store temp token in Redis with role
      await this.redisService.set(`temp_token:${tempToken}`, JSON.stringify({
        userId: user.id,
        role: selectedRole.role,
      }), 300);

      return {
        requiresTwoFactor: true,
        tempToken,
        message: 'Please verify 2FA code',
      };
    }

    // Generate JWT token
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');
    const expiresInSeconds = this.parseJwtExpiration(jwtExpiresIn);
    
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: selectedRole.role,
    }, { expiresIn: jwtExpiresIn });

    // Store token in Redis whitelist
    await this.tokenWhitelistService.addToken(
      user.id,
      selectedRole.role,
      token,
      expiresInSeconds
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: selectedRole.role,
        roles: activeRoles.map((ur) => ur.role),
      },
    };
  }

  async login(loginDto: LoginDto, requestedRole?: string) {
    const { email, password, captchaToken } = loginDto;

    // Validate captcha if enabled
    if (this.isCaptchaEnabled) {
      if (!captchaToken) {
        throw new BadRequestException('Captcha token is required');
      }
      
      try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: {
            secret: this.recaptchaSecretKey,
            response: captchaToken,
          },
        });

        if (!response.data.success) {
          throw new BadRequestException('Invalid captcha verification');
        }
      } catch (error) {
        this.logger.error('Captcha verification failed:', error);
        throw new BadRequestException('Captcha verification failed');
      }
    }

    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(`Login attempt failed: User not found - ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (!user.passwordHash) {
      this.logger.error(`User ${user.id} has no password hash`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login attempt failed: Invalid password for user ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login successful for user: ${email}`);

    // Get active, non-blocked roles
    const activeRoles = user.getActiveRoles();

    if (activeRoles.length === 0) {
      throw new UnauthorizedException('No active roles found for this user');
    }

    // If role is requested, check if user has that role
    let selectedRole: UserRoleEntity;
    if (requestedRole) {
      selectedRole = activeRoles.find((ur) => ur.role === requestedRole);
      if (!selectedRole) {
        throw new UnauthorizedException(`User does not have ${requestedRole} role or it is blocked`);
      }
    } else {
      // Default to first active role (prefer admin/super_admin over user)
      selectedRole = activeRoles.find((ur) => ur.role === UserRole.SUPER_ADMIN) ||
                     activeRoles.find((ur) => ur.role === UserRole.ADMIN) ||
                     activeRoles[0];
    }

    // If 2FA is enabled, return temp token for 2FA verification
    if (user.isTwoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { userId: user.id, email: user.email, role: selectedRole.role, temp: true },
        { expiresIn: '5m' },
      );

      // Store temp token in Redis with role
      await this.redisService.set(`temp_token:${tempToken}`, JSON.stringify({
        userId: user.id,
        role: selectedRole.role,
      }), 300);

      return {
        requiresTwoFactor: true,
        tempToken,
        message: 'Please verify 2FA code',
      };
    }

    // Generate JWT token
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');
    const expiresInSeconds = this.parseJwtExpiration(jwtExpiresIn);
    
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: selectedRole.role,
    }, { expiresIn: jwtExpiresIn });

    // Store token in Redis whitelist
    await this.tokenWhitelistService.addToken(
      user.id,
      selectedRole.role,
      token,
      expiresInSeconds
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: selectedRole.role,
        roles: activeRoles.map((ur) => ur.role),
      },
    };
  }

  async verify2FA(verify2FADto: Verify2FADto) {
    const { code, tempToken } = verify2FADto;

    // Get user ID and role from temp token
    const tokenData = await this.redisService.get(`temp_token:${tempToken}`);
    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired temp token');
    }

    const { userId, role } = JSON.parse(tokenData);
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isTwoFactorEnabled) {
      throw new UnauthorizedException('2FA not enabled for this user');
    }

    // Verify 2FA code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Verify role is still active
    const userRole = user.getActiveRoles().find((ur) => ur.role === role);
    if (!userRole) {
      throw new UnauthorizedException('Role is no longer active or is blocked');
    }

    // Delete temp token
    await this.redisService.del(`temp_token:${tempToken}`);

    // Generate final JWT token
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');
    const expiresInSeconds = this.parseJwtExpiration(jwtExpiresIn);
    
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: userRole.role,
    }, { expiresIn: jwtExpiresIn });

    // Store token in Redis whitelist
    await this.tokenWhitelistService.addToken(
      user.id,
      userRole.role,
      token,
      expiresInSeconds
    );

    const activeRoles = user.getActiveRoles();

    return {
      token,
      user: {
        id: user.id,
        displayId: user.displayId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: userRole.role,
        roles: activeRoles.map((ur) => ur.role),
      },
    };
  }

  async sendResetPasswordLink(sendResetPasswordDto: SendResetPasswordDto) {
    const { email } = sendResetPasswordDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save reset token
    await this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
      isUsed: false,
    });

    // Send reset email via RabbitMQ
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.rabbitMQService.publish('email-notifications', {
      to: user.email,
      subject: 'Reset Your Password',
      template: 'reset-password',
      data: {
        name: user.fullName,
        resetLink,
      },
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, twoFactorCode } = resetPasswordDto;

    // Find reset token
    const passwordReset = await this.passwordResetRepository.findByToken(token);

    if (!passwordReset || passwordReset.isUsed) {
      throw new BadRequestException('Invalid or used reset token');
    }

    if (new Date() > passwordReset.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    const user = passwordReset.user;

    // Verify 2FA code
    if (user.isTwoFactorEnabled) {
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });

    // Mark reset token as used
    await this.passwordResetRepository.update(passwordReset.id, { isUsed: true });

    // Emit user.updated event for all active roles
    const userRoles = await this.userRoleRepository.findActiveRolesByUserId(user.id);

    for (const userRole of userRoles) {
      await this.kafkaService.emit('user.updated', {
        userId: user.id,
        displayId: user.displayId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        role: userRole.role,
        timestamp: new Date().toISOString(),
      });
    }

    return { message: 'Password reset successfully' };
  }

  async setup2FA(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if 2FA is already enabled
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled for this user');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Stablecoin Platform (${user.email})`,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const backupCodesJson = JSON.stringify(backupCodes);

    // Create or update 2FA record
    const twoFactorAuth = await this.twoFactorAuthRepository.createOrUpdate(user.id, {
      secret: secret.base32,
      backupCodes: backupCodesJson,
      isEnabled: false,
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      qrCodeUrl: qrCodeUrl,
      backupCodes: backupCodes,
    };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if 2FA is already enabled
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled for this user');
    }

    const twoFactorAuth = await this.twoFactorAuthRepository.findByUserId(userId);

    if (!twoFactorAuth) {
      throw new BadRequestException('2FA setup not initiated. Please setup 2FA first.');
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code. Please verify the code from your authenticator app.');
    }

    // Enable 2FA - Update both users table and two_factor_auth table
    await this.userRepository.update(user.id, {
      isTwoFactorEnabled: true,
      twoFactorSecret: twoFactorAuth.secret,
    });

    await this.twoFactorAuthRepository.update(twoFactorAuth.id, { 
      isEnabled: true 
    });

    // Parse backup codes for response
    let backupCodes = [];
    if (twoFactorAuth.backupCodes) {
      try {
        backupCodes = JSON.parse(twoFactorAuth.backupCodes);
      } catch (e) {
        this.logger.warn('Failed to parse backup codes');
      }
    }

    return { 
      message: '2FA enabled successfully',
      backupCodes: backupCodes,
    };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if 2FA is enabled
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    const twoFactorAuth = await this.twoFactorAuthRepository.findByUserId(userId);

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    // Verify code before disabling
    const isValid = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code. Please verify the code from your authenticator app.');
    }

    // Disable 2FA - Update both users table and two_factor_auth table
    await this.userRepository.update(user.id, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    await this.twoFactorAuthRepository.update(twoFactorAuth.id, { 
      isEnabled: false 
    });

    this.logger.log(`2FA disabled for user: ${user.email} (${userId})`);

    return { 
      message: '2FA disabled successfully',
    };
  }

  /**
   * Create admin user (super_admin only)
   */
  async createAdmin(createAdminDto: CreateAdminDto): Promise<any> {
    const { email, password, firstName, lastName, mobileNumber, countryCode, role, captchaToken } = createAdminDto;

    // Validate captcha if enabled
    if (this.isCaptchaEnabled) {
      if (!captchaToken) {
        throw new BadRequestException('Captcha token is required');
      }
      
      try {
        const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
          params: {
            secret: this.recaptchaSecretKey,
            response: captchaToken,
          },
        });

        if (!response.data.success) {
          throw new BadRequestException('Invalid captcha verification');
        }
      } catch (error) {
        this.logger.error('Captcha verification failed:', error);
        throw new BadRequestException('Captcha verification failed');
      }
    }

    // Validate role is admin or super_admin
    if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only admin or super_admin roles can be created');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists with this email
      let user = await queryRunner.manager.findOne(User, {
        where: { email },
        relations: ['userRoles'],
      });

      if (user) {
        // User exists, check if role already exists
        const existingRole = await queryRunner.manager.findOne(UserRoleEntity, {
          where: { userId: user.id, role },
        });

        if (existingRole) {
          throw new BadRequestException(`User already has ${role} role`);
        }

        // Add role to existing user
        const userRole = queryRunner.manager.create(UserRoleEntity, {
          userId: user.id,
          role,
          isActive: true,
          isBlocked: false,
        });
        await queryRunner.manager.save(userRole);
      } else {
        // Generate unique display ID
        const displayId = await this.displayIdService.generateUniqueDisplayId();
        
        // Create new user
        user = queryRunner.manager.create(User, {
          displayId,
          email,
          passwordHash,
          firstName,
          lastName,
          mobileNumber,
          countryCode,
        });
        const savedUser = await queryRunner.manager.save(user);

        // Create role
        const userRole = queryRunner.manager.create(UserRoleEntity, {
          userId: savedUser.id,
          role,
          isActive: true,
          isBlocked: false,
        });
        await queryRunner.manager.save(userRole);
      }

      await queryRunner.commitTransaction();

      // Emit user.created event for this role
      await this.kafkaService.emit('user.created', {
        userId: user.id,
        displayId: user.displayId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        countryCode: user.countryCode,
        role,
        timestamp: new Date().toISOString(),
      });

      // Send welcome email via RabbitMQ
      await this.rabbitMQService.publish('email-notifications', {
        to: user.email,
        subject: `Welcome as ${role} - Stablecoin Platform`,
        template: 'admin-welcome',
        data: {
          name: user.fullName,
          role,
        },
      });

      return {
        message: `${role} created successfully`,
        userId: user.id,
        email: user.email,
        role,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: UserRole): Promise<UserRoleEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if role already exists
    const existingRole = await this.userRoleRepository.findByUserIdAndRole(userId, role);

    if (existingRole) {
      throw new BadRequestException(`User already has ${role} role`);
    }

    const savedRole = await this.userRoleRepository.create({
      userId,
      role,
      isActive: true,
      isBlocked: false,
    });

    // Emit user.created event for this role
    await this.kafkaService.emit('user.created', {
      userId,
      displayId: user.displayId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      role,
      timestamp: new Date().toISOString(),
    });

    return savedRole;
  }

  /**
   * Activate/Deactivate role
   */
  async toggleRoleStatus(userId: string, role: UserRole, isActive: boolean): Promise<UserRoleEntity> {
    const userRole = await this.userRoleRepository.findByUserIdAndRole(userId, role);

    if (!userRole) {
      throw new NotFoundException(`User does not have ${role} role`);
    }

    await this.userRoleRepository.update(userRole.id, { isActive });
    const updatedRole = await this.userRoleRepository.findByUserIdAndRole(userId, role);

    // Emit user.updated event
    const user = await this.userRepository.findById(userId);
    await this.kafkaService.emit('user.updated', {
      userId,
      displayId: user.displayId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      role,
      timestamp: new Date().toISOString(),
    });

    return updatedRole;
  }

  /**
   * Block/Unblock role
   */
  async toggleRoleBlock(userId: string, role: UserRole, isBlocked: boolean): Promise<UserRoleEntity> {
    const userRole = await this.userRoleRepository.findByUserIdAndRole(userId, role);

    if (!userRole) {
      throw new NotFoundException(`User does not have ${role} role`);
    }

    await this.userRoleRepository.update(userRole.id, { isBlocked });
    const updatedRole = await this.userRoleRepository.findByUserIdAndRole(userId, role);

    // If role is blocked, remove all tokens for this role
    if (isBlocked) {
      await this.tokenWhitelistService.removeRoleTokens(userId, role);
      this.logger.log(`Removed tokens for blocked role: ${userId}:${role}`);
    }

    // Emit user.updated event
    const user = await this.userRepository.findById(userId);
    await this.kafkaService.emit('user.updated', {
      userId,
      displayId: user.displayId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      role,
      timestamp: new Date().toISOString(),
    });

    return updatedRole;
  }

  /**
   * Refresh JWT token - extends token TTL
   */
  async refreshToken(userId: string, role: string, currentToken: string): Promise<{ token: string }> {
    // Check if current token is valid in whitelist
    const isValid = await this.tokenWhitelistService.isTokenValid(userId, role, currentToken);
    if (!isValid) {
      throw new UnauthorizedException('Current token is not valid');
    }

    // Generate new token with same expiration
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');
    const expiresInSeconds = this.parseJwtExpiration(jwtExpiresIn);
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newToken = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: role,
    }, { expiresIn: jwtExpiresIn });

    // Update token in whitelist (extend TTL or replace)
    await this.tokenWhitelistService.refreshToken(userId, role, newToken, expiresInSeconds);

    return { token: newToken };
  }

  /**
   * Logout - remove token from whitelist
   */
  async logout(userId: string, role: string): Promise<{ message: string }> {
    await this.tokenWhitelistService.removeToken(userId, role);
    return { message: 'Logged out successfully' };
  }

  /**
   * Parse JWT expiration string to seconds
   * Examples: '24h' -> 86400, '1h' -> 3600, '30m' -> 1800
   */
  private parseJwtExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 24 hours if format is invalid
      return 86400;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 86400; // Default to 24 hours
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
