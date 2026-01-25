import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Get ConfigService
  const configService = app.get(ConfigService);
  
  // Log connection status
  console.log('\n📋 Service Configuration Status:');
  console.log(`   Database: ${configService.get('DATABASE_HOST', 'localhost')}:${configService.get('DATABASE_PORT', 5432)}`);
  console.log(`   Redis: ${configService.get('USE_REDIS', 'false') === 'true' ? 'Enabled' : 'Disabled'} (${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)})`);
  console.log(`   Kafka: ${configService.get('KAFKA_BROKER', 'localhost:9092')}`);
  console.log('');
  
  // Connect Kafka microservice for event patterns (with graceful failure)
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: configService.get('KAFKA_CLIENT_ID', 'transaction-fireblocks-service'),
          brokers: [configService.get('KAFKA_BROKER', 'localhost:9092')],
        },
        consumer: {
          groupId: configService.get('KAFKA_GROUP_ID', 'transaction-fireblocks-service-group'),
        },
      },
    });
    
    await app.startAllMicroservices();
    console.log('✅ Kafka microservice connected');
  } catch (error) {
    console.warn(`⚠️  Failed to connect to Kafka: ${error.message}`);
    console.warn('⚠️  Service will continue without Kafka. Event publishing will be skipped.');
  }

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3007', 'http://localhost:3008'];
  
  // Check if wildcard is enabled (only when credentials is false)
  const allowAllOrigins = corsOrigins.includes('*');
  
  app.enableCors({
    origin: (origin, callback) => {
      // If wildcard is enabled and credentials is false, allow all
      if (allowAllOrigins) {
        return callback(null, true);
      }
      
      // Allow requests with no origin (like mobile apps, Postman, or curl requests)
      // Note: When credentials: true, browsers will always send origin header
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}. Allowed origins: ${corsOrigins.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // 24 hours
  });
  
  console.log(`🌐 CORS enabled for origins: ${corsOrigins.join(', ')}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Transaction Fireblocks Service API')
    .setDescription('Transaction Service with Fireblocks Integration')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 Transaction Fireblocks Service running on: http://localhost:${port}`);
}

bootstrap();
