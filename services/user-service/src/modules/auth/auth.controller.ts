import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard';
import { UserRole } from '../../shared/database/entities/user-role.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login (defaults to first active role)' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Admin login - checks if user has admin or super_admin role' })
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto) {
    return this.authService.adminLogin(loginDto);
  }

  @Post('super-admin/login')
  @ApiOperation({ summary: 'Super Admin login' })
  @HttpCode(HttpStatus.OK)
  async superAdminLogin(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto, UserRole.SUPER_ADMIN);
  }

  @Post('login/:role')
  @ApiOperation({ summary: 'Login with specific role (user, admin, super_admin)' })
  @HttpCode(HttpStatus.OK)
  async loginWithRole(@Param('role') role: string, @Body() loginDto: LoginDto) {
    return this.authService.login(loginDto, role as UserRole);
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Verify 2FA code' })
  @HttpCode(HttpStatus.OK)
  async verify2FA(@Body() verify2FADto: Verify2FADto) {
    return this.authService.verify2FA(verify2FADto);
  }

  @Post('send-reset-password')
  @ApiOperation({ summary: 'Send password reset link' })
  @HttpCode(HttpStatus.OK)
  async sendResetPasswordLink(@Body() sendResetPasswordDto: SendResetPasswordDto) {
    return this.authService.sendResetPasswordLink(sendResetPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('setup-2fa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup 2FA' })
  @HttpCode(HttpStatus.OK)
  async setup2FA(@Request() req) {
    return this.authService.setup2FA(req.user.userId);
  }

  @Post('enable-2fa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA' })
  @HttpCode(HttpStatus.OK)
  async enable2FA(@Request() req, @Body() body: { code: string }) {
    return this.authService.enable2FA(req.user.userId, body.code);
  }

  @Post('disable-2fa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @HttpCode(HttpStatus.OK)
  async disable2FA(@Request() req, @Body() body: { code: string }) {
    return this.authService.disable2FA(req.user.userId, body.code);
  }

  @Post('assign-role/:userId/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to user (admin/super_admin only)' })
  @HttpCode(HttpStatus.OK)
  async assignRole(
    @Request() req,
    @Param('userId') userId: string,
    @Param('role') role: string,
  ) {
    // Check if requester has admin or super_admin role
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }
    return this.authService.assignRole(userId, role as UserRole);
  }

  @Patch('toggle-role-status/:userId/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/Deactivate user role (admin/super_admin only)' })
  @HttpCode(HttpStatus.OK)
  async toggleRoleStatus(
    @Request() req,
    @Param('userId') userId: string,
    @Param('role') role: string,
    @Body() body: { isActive: boolean },
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }
    return this.authService.toggleRoleStatus(userId, role as UserRole, body.isActive);
  }

  @Patch('toggle-role-block/:userId/:role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block/Unblock user role (admin/super_admin only)' })
  @HttpCode(HttpStatus.OK)
  async toggleRoleBlock(
    @Request() req,
    @Param('userId') userId: string,
    @Param('role') role: string,
    @Body() body: { isBlocked: boolean },
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Admin access required');
    }
    return this.authService.toggleRoleBlock(userId, role as UserRole, body.isBlocked);
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin user (super_admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async createAdmin(@Request() req, @Body() createAdminDto: CreateAdminDto) {
    // Only super_admin can create admin users
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Super Admin access required');
    }
    return this.authService.createAdmin(createAdminDto);
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Request() req) {
    const user = req.user;
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.replace('Bearer ', '');
    
    if (!currentToken) {
      throw new Error('Token is required');
    }
    
    return this.authService.refreshToken(user.userId, user.role, currentToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user - removes token from whitelist' })
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    const user = req.user;
    return this.authService.logout(user.userId, user.role);
  }
}
