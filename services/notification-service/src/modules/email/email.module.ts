import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Email, EmailSchema } from './entities/email.entity';
import { EmailService } from './email.service';
import { EmailProviderFactory } from './email-provider.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
  ],
  providers: [EmailService, EmailProviderFactory],
  exports: [EmailService, EmailProviderFactory, MongooseModule],
})
export class EmailModule {}
