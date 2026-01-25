import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for Socket.IO
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3006', 'http://localhost:3007'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 Transaction Socket Service running on: http://localhost:${port}`);
}

bootstrap();
