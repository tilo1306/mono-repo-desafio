import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppService } from '../src/app.service';
import { User } from '../src/entities/user.entity';
import { TestAppModule } from './test-app.module';

describe('Auth Service E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let appService: AppService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    appService = moduleFixture.get<AppService>(AppService);

    await app.init();

    await dataSource.getRepository(User).clear();
  });

  afterEach(async () => {
    if (dataSource) {
      await dataSource.getRepository(User).clear();
    }
    await app.close();
  });

  describe('Database', () => {
    it('should have clean database', async () => {
      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(0);
    });
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(1);

      const user = await dataSource.getRepository(User).findOne({
        where: { email: userData.email },
      });

      expect(user).toBeDefined();
      expect(user!.name).toBe(userData.name);
      expect(user!.email).toBe(userData.email);
      expect(user!.password).toBeDefined();
      expect(user!.password).not.toBe(userData.password);
      expect(user!.password.length).toBeGreaterThan(50);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      await expect(appService.register(userData)).rejects.toThrow(
        'Email already exists',
      );

      const userCount = await dataSource.getRepository(User).count();
      expect(userCount).toBe(1);
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);
    });

    it('should login successfully and return tokens', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'password123',
      };

      const result = await appService.login(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should not login with wrong password', async () => {
      const loginData = {
        email: 'joao@example.com',
        password: 'wrongpassword',
      };

      await expect(appService.login(loginData)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(appService.login(loginData)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('Token Refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
      };

      await appService.register(userData);

      const loginResult = await appService.login({
        email: userData.email,
        password: userData.password,
      });

      refreshToken = loginResult.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const result = await appService.refreshToken({ refreshToken });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should not refresh with invalid token', async () => {
      await expect(
        appService.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow('Error refreshing token');
    });
  });
});
