# AWS S3 Generic File Storage with Access Control

## Overview

This implementation provides a generic AWS S3 file storage system with access control for the stablecoin-platform user-service. It ensures that:

- **Users can only access their own files** (profile images, documents, etc.)
- **Admin and super_admin can access all files**
- Files are stored with a consistent naming pattern: `destination/fieldname-randomId-userId.ext`
- Supports both AWS S3 and local storage (fallback)

## Architecture

### Components

1. **S3Service** (`src/shared/storage/s3.service.ts`)
   - Generic AWS S3 service for file operations
   - Handles upload, download, deletion, and access control
   - Validates file access based on user ID and role

2. **StorageService** (`src/shared/storage/storage.service.ts`)
   - High-level storage service that uses S3Service when S3 is enabled
   - Falls back to local storage when S3 is not configured
   - Provides unified interface for file operations

3. **FileAccessController** (`src/shared/storage/file-access.controller.ts`)
   - REST endpoint for accessing files with access control
   - GET `/files?key={s3-key}` - Get file URL with access validation

## File Naming Convention

Files are stored with the following naming pattern:
```
{destination}/{fieldname}-{randomId}-{userId}.{ext}
```

Example:
```
profile-images/profile-image-a1b2c3d4e5f6-user123.jpg
```

This pattern allows the system to:
- Extract the owner's userId from the filename
- Validate that the requesting user matches the file owner (unless admin)

## Access Control Logic

### Regular Users
- Can only access files where `userId` in filename matches their own `userId`
- Access denied if trying to access another user's file
- Returns `ForbiddenException` (403) if unauthorized

### Admin/Super Admin Users
- Can access **all files** regardless of owner
- Role must be `'admin'` or `'super_admin'` (from JWT token)
- Bypasses ownership checks

### Implementation Flow

1. User requests file via `/files?key={s3-key}` or profile image endpoint
2. `S3Service.getSignedUrl()` validates access:
   - If admin/super_admin → allow access
   - If regular user → check if userId matches file owner
3. Returns signed URL if access granted, throws `ForbiddenException` if denied

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# File Upload Configuration
UPLOAD_DIR=./uploads/profile-images
BASE_URL=http://localhost:3001

# AWS S3 Configuration (optional - if not set, uses local storage)
USE_S3_UPLOAD=true
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_S3_REGION=us-east-1
```

### Dependencies

Install required packages:

```bash
npm install aws-sdk multer-s3 nanoid
npm install --save-dev @types/multer-s3
```

## Usage Examples

### Upload Profile Image

```typescript
// POST /users/me/profile-image
// Automatically uses S3 if configured, otherwise local storage
// File naming: profile-images/file-{randomId}-{userId}.{ext}
```

### Get File URL (with access control)

```typescript
// GET /files?key=profile-images/profile-image-abc123-user456.jpg
// Access control is automatically enforced:
// - User can only access their own files
// - Admin can access all files
```

### Using StorageService Directly

```typescript
// Upload file
const imagePath = await storageService.saveProfileImage(file, userId);

// Get URL with access control
const url = await storageService.getProfileImageUrl(imagePath, userId, userRole);

// Upload any file
const filePath = await storageService.uploadFile(
  file,
  userId,
  'documents', // destination folder
  { type: 'kyc-document' } // optional metadata
);
```

### Using S3Service Directly

```typescript
// Upload file
const key = await s3Service.uploadFile({
  destination: 'documents',
  file: multerFile,
  userId: user.id,
  metadata: { type: 'kyc-document' },
});

// Get signed URL (with access control)
const url = await s3Service.getSignedUrl({
  key: 'documents/doc-abc123-user456.pdf',
  userId: user.id,
  userRole: 'user', // or 'admin' or 'super_admin'
});

// Delete file (with access control)
await s3Service.deleteFile(
  'documents/doc-abc123-user456.pdf',
  user.id,
  'user'
);
```

## Security Features

1. **Access Validation**: Every file access is validated before granting access
2. **Signed URLs**: Files are accessed via time-limited signed URLs (1 hour expiry)
3. **Role-Based Access**: Admin users bypass ownership checks
4. **Filename Validation**: User ID is extracted from filename and validated
5. **Error Handling**: Proper exceptions for unauthorized access (`ForbiddenException`)

## API Endpoints

### Get File URL
```
GET /files?key={s3-key}
Authorization: Bearer {token}

Response:
{
  "url": "https://s3.amazonaws.com/...",
  "expiresIn": 3600
}
```

### Upload Profile Image
```
POST /users/me/profile-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- file: (binary)

Response:
{
  "message": "Profile image uploaded successfully",
  "profileImage": "https://s3.amazonaws.com/..."
}
```

## Files Created/Modified

### Created Files
- ✅ `src/shared/storage/s3.service.ts` - Generic S3 service with access control
- ✅ `src/shared/storage/file-access.controller.ts` - File access endpoint

### Modified Files
- ✅ `src/shared/storage/storage.service.ts` - Updated to use S3Service
- ✅ `src/shared/storage/storage.module.ts` - Added S3Service and FileAccessController
- ✅ `src/shared/storage/multer.config.ts` - Updated for S3 support
- ✅ `src/modules/user/user.controller.ts` - Updated to use async getProfileImageUrl with access control
- ✅ `package.json` - Added aws-sdk, multer-s3, nanoid dependencies
- ✅ `env.example` - Added AWS S3 configuration

## Testing Access Control

### Regular User Access
```bash
# User tries to access their own file - should succeed
GET /files?key=profile-images/profile-abc-user123.jpg
Authorization: Bearer {user123-token}

# User tries to access another user's file - should fail (403)
GET /files?key=profile-images/profile-xyz-user456.jpg
Authorization: Bearer {user123-token}
# Response: 403 Forbidden - "You do not have permission to access this file"
```

### Admin Access
```bash
# Admin tries to access any file - should succeed
GET /files?key=profile-images/profile-xyz-user456.jpg
Authorization: Bearer {admin-token}
# Response: 200 OK with signed URL
```

## Migration Notes

- The system automatically falls back to local storage if S3 is not configured
- Existing local files will continue to work
- New uploads will use S3 if configured, otherwise local storage
- Access control is enforced on file retrieval, not upload
- Profile images in user responses now use async `getProfileImageUrl()` with access control

## Next Steps

1. **Install Dependencies**: Run `npm install` to install aws-sdk, multer-s3, nanoid
2. **Configure AWS S3**: Set environment variables for AWS S3
3. **Test Upload**: Upload a profile image and verify it's stored correctly
4. **Test Access Control**: Verify users can only access their own files
5. **Test Admin Access**: Verify admin/super_admin can access all files
