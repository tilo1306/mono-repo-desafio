import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationWebSocketGateway } from '../../gateways/notification-websocket.gateway';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get(
              'NOTIFICATIONS_SERVICE_HOST',
              'notifications-service',
            ),
            port: configService.get('NOTIFICATIONS_SERVICE_TCP_PORT', 3005),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationWebSocketGateway],
  exports: [ClientsModule, NotificationWebSocketGateway],
})
export class NotificationModule {}
