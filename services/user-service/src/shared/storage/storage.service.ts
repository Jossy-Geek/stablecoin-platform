import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from './s3.service';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads/profile-images');
    if (!this.s3Service.isS3Enabled()) {
      this.ensureUploadDirExists();
    }
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save uploaded file and return relative path or S3 key
   * Supports both local storage and AWS S3
   */
  async saveProfileImage(file: Express.Multer.File, userId: string): Promise<string> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    // Use S3 if enabled, otherwise use local storage
    if (this.s3Service.isS3Enabled()) {
      return await this.s3Service.uploadFile({
        destination: 'profile-images',
        file,
        userId,
        metadata: { type: 'profile-image' },
      });
    }

    // Local storage fallback
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return relative path
    return `profile-images/${fileName}`;
  }

  /**
   * Upload any file (generic method)
   * @param file File to upload
   * @param userId User ID
   * @param destination Destination folder (e.g., 'documents', 'kyc', 'profile-images')
   * @param metadata Optional metadata
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    destination: string = 'files',
    metadata?: Record<string, string>,
  ): Promise<string> {
    if (this.s3Service.isS3Enabled()) {
      return await this.s3Service.uploadFile({
        destination,
        file,
        userId,
        metadata,
      });
    }

    // Local storage fallback
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const uploadPath = path.join(this.uploadDir, '..', destination);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `${destination}/${fileName}`;
  }

  /**
   * Delete profile image file
   */
  async deleteProfileImage(imagePath: string, userId: string, userRole?: string): Promise<void> {
    if (!imagePath) return;

    try {
      if (this.s3Service.isS3Enabled()) {
        await this.s3Service.deleteFile(imagePath, userId, userRole);
      } else {
        const fullPath = path.join(this.uploadDir, path.basename(imagePath));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    } catch (error) {
      // Log error but don't throw - file might already be deleted
      console.error(`Error deleting profile image: ${error.message}`);
    }
  }

  /**
   * Get full URL for profile image or signed URL for S3
   * @param imagePath Image path or S3 key
   * @param userId User ID requesting the URL
   * @param userRole User role (for access control)
   */
  async getProfileImageUrl(imagePath: string, userId: string, userRole?: string): Promise<string | null> {
    if (!imagePath) return null;

    if (this.s3Service.isS3Enabled()) {
      try {
        // Return signed URL with access control
        return await this.s3Service.getSignedUrl({
          key: imagePath,
          userId,
          userRole,
        });
      } catch (error) {
        console.error(`Error getting S3 signed URL: ${error.message}`);
        return null;
      }
    }

    // Local storage fallback
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    return `${baseUrl}/uploads/${imagePath}`;
  }

  /**
   * Get file URL with access control (generic method)
   * @param filePath File path or S3 key
   * @param userId User ID requesting the URL
   * @param userRole User role (for access control)
   */
  async getFileUrl(filePath: string, userId: string, userRole?: string): Promise<string | null> {
    if (!filePath) return null;

    if (this.s3Service.isS3Enabled()) {
      try {
        return await this.s3Service.getSignedUrl({
          key: filePath,
          userId,
          userRole,
        });
      } catch (error) {
        console.error(`Error getting S3 signed URL: ${error.message}`);
        return null;
      }
    }

    // Local storage fallback
    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3001');
    return `${baseUrl}/uploads/${filePath}`;
  }
}
