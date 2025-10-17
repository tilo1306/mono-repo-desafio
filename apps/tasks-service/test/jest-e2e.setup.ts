import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

export let app: INestApplication;
export let dataSource: DataSource;

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  dataSource = app.get(DataSource);

  await dataSource.runMigrations();
});

afterAll(async () => {
  if (dataSource) {
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
});

beforeEach(async () => {
  if (dataSource) {
    try {
      await dataSource.query('TRUNCATE TABLE comments CASCADE');
      await dataSource.query('TRUNCATE TABLE assignees CASCADE');
      await dataSource.query('TRUNCATE TABLE tasks CASCADE');
    } catch (error) {
      console.warn('Could not truncate tables:', error.message);
    }
  }
});

afterEach(async () => {
  if (dataSource) {
    try {
      await dataSource.query('TRUNCATE TABLE comments CASCADE');
      await dataSource.query('TRUNCATE TABLE assignees CASCADE');
      await dataSource.query('TRUNCATE TABLE tasks CASCADE');
    } catch (error) {
      console.warn('Could not truncate tables:', error.message);
    }
  }
});
