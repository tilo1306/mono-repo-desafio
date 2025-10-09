import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';

config({ path: '.env.test' });

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_TEST_NAME || 'challenge_test_db',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  synchronize: true,
  dropSchema: true,
});
