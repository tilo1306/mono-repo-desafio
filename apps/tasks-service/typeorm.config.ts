import { DataSource } from 'typeorm';
import { Assignee } from './src/entities/assignee.entity';
import { Comment } from './src/entities/comment.entity';
import { TaskHistory } from './src/entities/history.entity';
import { Task } from './src/entities/task.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'challenge_db',
  entities: [Task, Assignee, Comment, TaskHistory],
  migrations: ['dist/src/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
