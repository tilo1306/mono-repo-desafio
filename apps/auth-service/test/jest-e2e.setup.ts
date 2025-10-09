import { config } from 'dotenv';
import { TestDataSource } from './typeorm-test.config';

config({ path: '.env.test' });

jest.setTimeout(30000);

beforeAll(async () => {
  try {
    await TestDataSource.initialize();
    console.log('Test database connection established');
    await TestDataSource.destroy();
  } catch (error) {
    console.error(
      '❌ Failed to connect to test database:',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
});

afterAll(async () => {});
