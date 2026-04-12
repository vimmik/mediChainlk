import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust the reverse proxy / ALB so req.ip and secure-cookie decisions are correct.
  // '1' = trust the first hop (our ALB). Never set to `true` unless you fully control
  // the entire proxy chain, or IP-based rate limiters become spoofable.
  app.set('trust proxy', 1);

  // Security headers. `crossOriginResourcePolicy: 'cross-origin'` lets the web portals
  // fetch assets from the API when served from a different origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Required for HttpOnly session cookies set by /auth/session
  app.use(cookieParser());

  app.enableCors({
    origin: [
      process.env.ADMIN_PORTAL_URL || 'http://localhost:3002',
      process.env.PHARMACY_PORTAL_URL || 'http://localhost:3003',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Shutdown hooks run OnModuleDestroy for every module (Redis quit, Prisma disconnect).
  // This is the hook ALB calls on SIGTERM during deregistration — we need to drain
  // in-flight requests before the container exits.
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('MediChainLK API')
    .setDescription('Pharmacy management platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Log graceful shutdown milestones for ALB troubleshooting.
  process.on('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('[shutdown] SIGTERM received — draining connections');
  });
}
bootstrap();
