import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationConsumer } from './consumers/notification.consumer';
import { Notification } from './entities/notification.entity';
import { NotificationWebSocketGateway } from './gateways/notification-websocket.gateway';
import { NotificationRepository } from './repositories/notification.repository';
import { WebSocketService } from './services/websocket.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'challenge_db'),
        entities: [Notification],
        migrations: ['src/migrations/*.ts'],
        migrationsRun: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Notification]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    NotificationConsumer,
    WebSocketService,
    NotificationWebSocketGateway,
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
  ],
})
export class AppModule {}
