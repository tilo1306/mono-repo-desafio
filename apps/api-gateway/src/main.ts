import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as swaggerUi from 'swagger-ui-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use((req, res, next) => {
    const staticFiles = [
      '/sw.js',
      '/sw.js.map',
      '/manifest.json',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/.well-known',
      '/assets/',
      '/static/',
    ];

    const isStaticFile = staticFiles.some(file => req.path.startsWith(file));

    if (isStaticFile) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Not Found',
        error: 'Static file not found - this is an API gateway',
      });
    }

    next();
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Desafio fullstack Jungle Gaming')
    .setDescription('Projeto NestJs em microserviços')
    .setVersion('1.0')
    .addTag('Auth', 'Endpoints for user authentication')
    .addTag('Tasks', 'Endpoints for task management')
    .addTag('Notifications', 'Endpoints for notification management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document));

  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Timezone-Val'],
  });
  const port = configService.get('PORT', 3001);

  await app.listen(port);
}
bootstrap();
