import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_SERVICE_HOST', 'auth-service'),
            port: configService.get('AUTH_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [],
  exports: [ClientsModule],
})
export class AuthModule {}
