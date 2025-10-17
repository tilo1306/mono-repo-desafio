import { DataSource } from 'typeorm';
import { Notification } from './src/entities/notification.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'challenge_db',
  entities: [Notification],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
