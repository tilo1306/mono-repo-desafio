import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AuthController } from './auth.controller'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '0.0.0.0',
          port: parseInt(process.env.PORT ?? '3001'),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [],
})
export class AuthModule {}
