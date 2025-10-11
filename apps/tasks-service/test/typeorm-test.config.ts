import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Task } from '../src/entities/task.entity';
import { User } from '../src/entities/user.entity';
import { Assignee } from '../src/entities/assignee.entity';
import { Comment } from '../src/entities/comment.entity';
import { TaskHistory } from '../src/entities/history.entity';

export const createTestDataSource = (configService: ConfigService) => {
  return new DataSource({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5433),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'password'),
    database: configService.get('DB_TEST_NAME', 'challenge_test_db'),
    entities: [Task, User, Assignee, Comment, TaskHistory],
    migrations: ['src/migrations/*.ts'],
    synchronize: true,
    dropSchema: true,
  });
};
