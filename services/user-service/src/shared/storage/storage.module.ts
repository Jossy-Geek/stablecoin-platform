import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3Service } from './s3.service';
import { FileAccessController } from './file-access.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FileAccessController],
  providers: [StorageService, S3Service],
  exports: [StorageService, S3Service],
})
export class StorageModule {}
