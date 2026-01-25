import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { S3Service } from './s3.service';

/**
 * File Access Controller
 * Provides endpoints to access files with proper access control:
 * - Users can only access their own files
 * - Admin and super_admin can access all files
 */
@ApiTags('File Access')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FileAccessController {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Get file URL with access control
   * GET /files?key=profile-images/profile-image-abc123-user456.jpg
   * 
   * Access Control:
   * - Regular users can only access files where userId in filename matches their own userId
   * - Admin and super_admin can access any file
   */
  @Get()
  @ApiOperation({ summary: 'Get file URL with access control' })
  @ApiQuery({
    name: 'key',
    description: 'S3 key or file path (format: destination/fieldname-randomId-userId.ext)',
    example: 'profile-images/profile-image-abc123-user456.jpg',
  })
  async getFile(@Query('key') key: string, @Request() req) {
    if (!key) {
      throw new NotFoundException('File key is required');
    }

    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get signed URL with access control
      const url = await this.s3Service.getSignedUrl({
        key,
        userId,
        userRole,
      });

      return {
        url,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }
}
