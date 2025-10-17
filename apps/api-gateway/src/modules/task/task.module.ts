import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TaskController } from './task.controller';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'TASKS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('TASKS_SERVICE_HOST', 'tasks-service'),
            port: configService.get('TASKS_SERVICE_PORT', 3003),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [TaskController],
  providers: [],
  exports: [ClientsModule],
})
export class TaskModule {}
