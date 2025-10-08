import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';

// Load environment variables
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'challenge_db',
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
