import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const DEFAULT_CORS_ORIGINS = [
  'https://abou-khalil.vercel.app',
  'https://abou-khalil-frontend.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    return [...new Set([...fromEnv, ...DEFAULT_CORS_ORIGINS])];
  }

  return DEFAULT_CORS_ORIGINS;
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Vercel production + preview deployments for this project
  return /^https:\/\/abou-khalil([a-z0-9-]*?)\.vercel\.app$/i.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = getAllowedOrigins();

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server calls (Next.js rewrites, curl, mobile tools)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  });

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
    .addTag('backup', 'Database backup (superAdmin only)')
    .addBearerAuth()
    .addServer('http://185.182.9.99:6000', 'Production server')
    .addServer('http://localhost:6000', 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 6000);
  await app.listen(port, '0.0.0.0');

  console.log(`Application running on http://0.0.0.0:${port}`);
  console.log(`API Documentation available at http://0.0.0.0:${port}/docs`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
void bootstrap();
