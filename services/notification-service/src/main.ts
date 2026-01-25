import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3004;
  
  // Configure CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  const allowedOrigins = corsOrigin === '*' 
    ? true 
    : corsOrigin.split(',').map(origin => origin.trim());
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  console.log(`🌐 CORS enabled for origins: ${corsOrigin === '*' ? 'All (*)' : corsOrigin}`);
  
  await app.listen(port);
  console.log(`🚀 Notification Service running on: http://localhost:${port}`);
  
  // Display configuration status
  console.log('\n📋 Configuration Status:');
  console.log(`   SMTP_HOST: ${configService.get('SMTP_HOST') ? '✅ Configured' : '❌ Not set'}`);
  console.log(`   SMTP_USER: ${configService.get('SMTP_USER') ? '✅ Configured' : '❌ Not set'}`);
  console.log(`   SMTP_PASSWORD: ${configService.get('SMTP_PASSWORD') ? '✅ Configured' : '❌ Not set'}`);
  console.log(`   RabbitMQ: ${configService.get('RABBITMQ_URL') ? '✅ Configured' : '❌ Not set'}`);
  console.log('\n💡 For SMTP setup instructions, see: SMTP_SETUP_GUIDE.md\n');
}

bootstrap();
