import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard';
import { StorageService } from '../../shared/storage/storage.service';
import { PaginationDto } from './dto/pagination.dto';

@ApiTags('User')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.userId);
    const roles = await this.userService.getUserRoles(req.user.userId);
    
    const userRoles = roles.length > 0 ? roles : [];
    
    const profileImageUrl = user.profileImage
      ? await this.storageService.getProfileImageUrl(user.profileImage, req.user.userId, req.user.role)
      : null;

    return {
      id: user.id,
      displayId: user.displayId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      profileImage: profileImageUrl,
      currentRole: req.user.role,
      roles: userRoles.map((r: any) => ({
        role: r.role,
        isActive: r.isActive !== undefined ? r.isActive : true,
        isBlocked: r.isBlocked !== undefined ? r.isBlocked : false,
      })),
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get users list with pagination and column filters (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'admin', 'super_admin'] })
  @ApiQuery({ name: 'displayId', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'firstName', required: false, type: String })
  @ApiQuery({ name: 'lastName', required: false, type: String })
  @ApiQuery({ name: 'countryCode', required: false, type: String })
  @ApiQuery({ name: 'mobileNumber', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async getUsersList(@Query() paginationDto: PaginationDto, @Request() req) {
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const result = await this.userService.getUsersList({
      page: paginationDto.page || 1,
      limit: paginationDto.limit || 10,
      search: paginationDto.search,
      role: paginationDto.role,
      displayId: paginationDto.displayId,
      email: paginationDto.email,
      firstName: paginationDto.firstName,
      lastName: paginationDto.lastName,
      countryCode: paginationDto.countryCode,
      mobileNumber: paginationDto.mobileNumber,
      active: paginationDto.active,
    });

    // Map users with profile image URLs (admin can see all images)
    const mappedData = await Promise.all(
      result.data.map(async (user: any) => {
        // Fetch user roles from database
        const userRoles = await this.userService.getUserRoles(user.id);
        
        // isVerified: user has at least one active, non-blocked role
        const isVerified = userRoles.some((r: any) => r.isActive && !r.isBlocked);
        
        return {
          id: user.id,
          displayId: user.displayId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          countryCode: user.countryCode,
          profileImage: user.profileImage
            ? await this.storageService.getProfileImageUrl(user.profileImage, req.user.userId, req.user.role)
            : null,
          isVerified,
          roles: userRoles.map((r: any) => ({
            role: r.role,
            isActive: r.isActive !== undefined ? r.isActive : true,
            isBlocked: r.isBlocked !== undefined ? r.isBlocked : false,
          })),
          createdAt: user.createdAt,
        };
      }),
    );

    return {
      ...result,
      data: mappedData,
    };
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get admins list with pagination (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'displayId', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'firstName', required: false, type: String })
  @ApiQuery({ name: 'lastName', required: false, type: String })
  @ApiQuery({ name: 'countryCode', required: false, type: String })
  @ApiQuery({ name: 'mobileNumber', required: false, type: String })
  async getAdminsList(@Query() paginationDto: PaginationDto, @Request() req) {
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const result = await this.userService.getAdminsList({
      page: paginationDto.page || 1,
      limit: paginationDto.limit || 10,
      displayId: paginationDto.displayId,
      email: paginationDto.email,
      firstName: paginationDto.firstName,
      lastName: paginationDto.lastName,
      countryCode: paginationDto.countryCode,
      mobileNumber: paginationDto.mobileNumber,
    });

    // Map admins with profile image URLs
    const mappedData = await Promise.all(
      result.data.map(async (user: any) => {
        // Fetch user roles from database
        const userRoles = await this.userService.getUserRoles(user.id);
        
        // isVerified: user has at least one active, non-blocked role
        const isVerified = userRoles.some((r: any) => r.isActive && !r.isBlocked);
        
        return {
          id: user.id,
          displayId: user.displayId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          countryCode: user.countryCode,
          profileImage: user.profileImage
            ? await this.storageService.getProfileImageUrl(user.profileImage, req.user.userId, req.user.role)
            : null,
          isVerified,
          roles: userRoles.map((r: any) => ({
            role: r.role,
            isActive: r.isActive !== undefined ? r.isActive : true,
            isBlocked: r.isBlocked !== undefined ? r.isBlocked : false,
          })),
          createdAt: user.createdAt,
        };
      }),
    );

    return {
      ...result,
      data: mappedData,
    };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile by ID with all details (Admin only)' })
  async getUserProfile(@Param('id') userId: string, @Request() req) {
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const user = await this.userService.getUserProfile(userId);
    const roles = await this.userService.getUserRoles(userId);

    // Admin can access any user's profile image
    const profileImageUrl = user.profileImage
      ? await this.storageService.getProfileImageUrl(user.profileImage, req.user.userId, req.user.role)
      : null;

    // isVerified: user has at least one active, non-blocked role
    const isVerified = roles.some((r) => r.isActive && !r.isBlocked);

    return {
      id: user.id,
      displayId: user.displayId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileNumber: user.mobileNumber,
      countryCode: user.countryCode,
      profileImage: profileImageUrl,
      isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      roles: roles.map((r) => ({
        role: r.role,
        isActive: r.isActive,
        isBlocked: r.isBlocked,
        createdAt: r.createdAt,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post('me/profile-image')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const userId = req.user.userId;
    const imagePath = await this.storageService.saveProfileImage(file, userId);
    const updatedUser = await this.userService.updateProfileImage(userId, imagePath);

    // Get URL with access control
    const profileImageUrl = await this.storageService.getProfileImageUrl(
      imagePath,
      userId,
      req.user.role,
    );

    return {
      message: 'Profile image uploaded successfully',
      profileImage: profileImageUrl,
    };
  }
}
