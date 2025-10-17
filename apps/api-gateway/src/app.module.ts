import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { InternalWebSocketController } from './controllers/internal-websocket.controller';
import { NotificationWebSocketGateway } from './gateways/notification-websocket.gateway';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TaskModule } from './modules/task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                const contextStr = context ? `[${context}]` : '';
                const metaStr = Object.keys(meta).length
                  ? ` ${JSON.stringify(meta)}`
                  : '';
                return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
              },
            ),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'secret123'),
        signOptions: {
          expiresIn: '1h',
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
    AuthModule,
    HealthModule,
    NotificationModule,
    TaskModule,
  ],
  controllers: [InternalWebSocketController],
  providers: [
    NotificationWebSocketGateway,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
