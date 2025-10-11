import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { Task } from '../src/entities/task.entity';
import { User } from '../src/entities/user.entity';
import { Assignee } from '../src/entities/assignee.entity';
import { Comment } from '../src/entities/comment.entity';
import { TaskHistory } from '../src/entities/history.entity';
import { TaskRepository } from '../src/repositories/task/task.repository';
import { UserRepository } from '../src/repositories/user/user.repository';
import { AssigneeRepository } from '../src/repositories/assignee/assignee.repository';
import { CommentRepository } from '../src/repositories/comment/comment.repository';
import { NotificationPublisherService } from '../src/services/notification-publisher.service';
import { createTestDataSource } from './typeorm-test.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dataSource = createTestDataSource(configService);
        return dataSource.options;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Task, User, Assignee, Comment, TaskHistory]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IAssigneeRepository',
      useClass: AssigneeRepository,
    },
    {
      provide: 'ICommentRepository',
      useClass: CommentRepository,
    },
        {
          provide: 'NOTIFICATION_SERVICE',
          useValue: {
            emit: jest.fn().mockReturnValue({
              subscribe: jest.fn(),
              toPromise: jest.fn().mockResolvedValue({}),
            }),
          },
        },
    {
      provide: WINSTON_MODULE_PROVIDER,
      useValue: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    },
    NotificationPublisherService,
  ],
})
export class TestAppModule {}
