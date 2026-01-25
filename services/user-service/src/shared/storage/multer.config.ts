import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/**
 * Profile image multer configuration
 * Supports both local storage and AWS S3
 * File naming format: fieldname-randomId-userId.ext (for S3)
 */
export const profileImageMulterConfig: MulterOptions = {
  storage: memoryStorage(), // Always use memory storage, S3Service will handle upload
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  },
};

/**
 * Generic file upload multer configuration
 * @param allowedMimeTypes Array of allowed MIME types
 * @param maxSize Maximum file size in bytes
 */
export const createFileUploadConfig = (
  allowedMimeTypes: string[],
  maxSize: number = 10 * 1024 * 1024, // Default 10MB
): MulterOptions => {
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: maxSize,
    },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
      }
    },
  };
};
