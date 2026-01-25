import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

export interface S3UploadOptions {
  destination: string;
  file: Express.Multer.File;
  userId: string;
  metadata?: Record<string, string>;
}

export interface S3GetOptions {
  key: string;
  userId: string;
  userRole?: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client | null;
  private readonly bucket: string;
  private readonly region: string;
  private readonly useS3: boolean;

  constructor(private readonly configService: ConfigService) {
    this.useS3 =
      this.configService.get('USE_S3_UPLOAD') === 'true' &&
      !!this.configService.get('AWS_ACCESS_KEY_ID') &&
      !!this.configService.get('AWS_SECRET_ACCESS_KEY') &&
      !!this.configService.get('AWS_S3_BUCKET');

    if (this.useS3) {
      this.bucket = this.configService.get('AWS_S3_BUCKET');
      this.region = this.configService.get('AWS_S3_REGION') || 'us-east-1';

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });

      this.logger.log('AWS S3 Service initialized (SDK v3)');
    } else {
      this.s3Client = null;
      this.logger.warn('AWS S3 not configured, using local storage');
    }
  }

  /**
   * Upload file to S3
   * @param options Upload options
   * @returns S3 key/path of uploaded file
   */
  async uploadFile(options: S3UploadOptions): Promise<string> {
    const { destination, file, userId, metadata = {} } = options;

    if (!this.useS3 || !this.s3Client) {
      throw new Error('S3 is not configured. Please set USE_S3_UPLOAD=true and AWS credentials.');
    }

    try {
      const ext = file.originalname.split('.').pop();
      const random = nanoid().replace('-', '');
      const key = `${destination}/${file.fieldname}-${random}-${userId}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          userId,
          uploadedAt: new Date().toISOString(),
          originalName: file.originalname,
          ...metadata,
        },
      });

      await this.s3Client.send(command);

      this.logger.log(`File uploaded to S3: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get signed URL for file access with access control
   * @param options Get options
   * @returns Signed URL
   */
  async getSignedUrl(options: S3GetOptions): Promise<string> {
    const { key, userId, userRole } = options;

    if (!this.useS3 || !this.s3Client) {
      throw new Error('S3 is not configured');
    }

    // Validate access before generating signed URL
    this.validateFileAccess(key, userId, userRole);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour

      return url;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`, error.stack);
      throw new NotFoundException('File not found');
    }
  }

  /**
   * Get file as buffer with access control
   * @param options Get options
   * @returns File buffer
   */
  async getFileBuffer(options: S3GetOptions): Promise<Buffer> {
    const { key, userId, userRole } = options;

    if (!this.useS3 || !this.s3Client) {
      throw new Error('S3 is not configured');
    }

    // Validate access before getting file
    this.validateFileAccess(key, userId, userRole);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new NotFoundException('File not found or empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      const stream = result.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Error getting file from S3: ${error.message}`, error.stack);
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  /**
   * Delete file from S3 with access control
   * @param key S3 key
   * @param userId User ID requesting deletion
   * @param userRole User role
   */
  async deleteFile(key: string, userId: string, userRole?: string): Promise<void> {
    if (!this.useS3 || !this.s3Client) {
      throw new Error('S3 is not configured');
    }

    // Validate access before deletion
    this.validateFileAccess(key, userId, userRole);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if file exists in S3
   * @param key S3 key
   * @returns True if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.useS3 || !this.s3Client) {
      return false;
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Validate file access based on user ID and role
   * - Admin and super_admin can access all files
   * - Regular users can only access their own files (userId in filename)
   * @param key S3 key (format: destination/fieldname-randomId-userId.ext)
   * @param userId User ID requesting access
   * @param userRole User role (optional)
   * @throws ForbiddenException if user doesn't have access
   */
  private validateFileAccess(key: string, userId: string, userRole?: string): void {
    // Admin and super_admin can access all files
    if (userRole === 'admin' || userRole === 'super_admin') {
      this.logger.debug(`Admin access granted for file: ${key}`);
      return;
    }

    // Extract userId from key (format: destination/fieldname-randomId-userId.ext)
    const keyParts = key.split('/');
    const filename = keyParts[keyParts.length - 1];
    const filenameParts = filename.split('-');

    // Check if filename contains userId (should be second to last part before extension)
    if (filenameParts.length < 3) {
      this.logger.warn(`Invalid file key format: ${key}`);
      throw new ForbiddenException('Invalid file access');
    }

    // Get the userId from filename (second to last part before extension)
    const fileUserId = filenameParts[filenameParts.length - 2];

    // User can only access their own files
    if (fileUserId !== userId) {
      this.logger.warn(`Access denied: User ${userId} tried to access file owned by ${fileUserId}`);
      throw new ForbiddenException('You do not have permission to access this file');
    }

    this.logger.debug(`Access granted for user ${userId} to file: ${key}`);
  }

  /**
   * Get file metadata
   * @param key S3 key
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<any> {
    if (!this.useS3 || !this.s3Client) {
      throw new Error('S3 is not configured');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.s3Client.send(command);
      return result;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  /**
   * Check if S3 is enabled
   */
  isS3Enabled(): boolean {
    return this.useS3;
  }
}
