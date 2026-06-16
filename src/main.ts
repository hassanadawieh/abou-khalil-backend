import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable static file serving for uploads
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Nest App API')
    .setDescription(
      'Professional API documentation for User and Role Management System',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authenticate users and manage access tokens')
    .addTag('roles', 'Manage application roles')
    .addTag('users', 'Manage application users')
    .addTag('employees', 'Manage employees')
    .addTag('customers', 'Manage customers')
    .addTag('suppliers', 'Manage suppliers')
    .addTag('invoices', 'Manage invoices')
    .addTag('items', 'Manage items with images and QR codes')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 6000);
  const port = process.env.PORT ?? 6000;
  console.log(`Application running on http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api/docs`);
}
void bootstrap();
