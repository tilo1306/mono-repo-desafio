import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '../auth/auth.module';
import { TaskModule } from '../task/task.module';
import { HealthController } from './health.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TerminusModule, AuthModule, TaskModule, NotificationModule],
  controllers: [HealthController],
})
export class HealthModule {}
