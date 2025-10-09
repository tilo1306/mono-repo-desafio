import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { TestAppModule } from './test-app.module';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    await app.init();

    await dataSource.getRepository(User).clear();
  });

  afterEach(async () => {
    if (dataSource) {
      await dataSource.getRepository(User).clear();
    }
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should have clean database', async () => {
    const userCount = await dataSource.getRepository(User).count();
    expect(userCount).toBe(0);
  });
});
