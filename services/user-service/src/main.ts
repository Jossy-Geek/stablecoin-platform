import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User Service API for Stablecoin Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static files for profile images
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 User Service is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
